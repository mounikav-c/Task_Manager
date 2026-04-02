import json
import logging
from typing import Any, Dict, List, Optional
from datetime import datetime
from uuid import uuid4
from langgraph.graph import StateGraph, END
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage
from django.contrib.auth import get_user_model
from accounts.models import AuthUserProfile, TeamMember, Meeting
from .models import ChatMessage
from .email_service import send_bulk_meeting_invitations

logger = logging.getLogger(__name__)
User = get_user_model()


class MeetingSchedulerAgent:
    """
    LangGraph-based agent for scheduling meetings via chat
    """
    
    def __init__(self, user, user_llm=None):
        """
        Initialize the meeting scheduler agent
        
        Args:
            user: Django user object
            user_llm: LangChain LLM instance (optional, uses mock if not provided)
        """
        self.user = user
        self.llm = user_llm
        self.graph = None
        self._build_graph()
    
    def _build_graph(self):
        """Build the LangGraph workflow"""
        # Create graph
        workflow = StateGraph(dict)
        
        # Define nodes
        workflow.add_node("process_input", self.process_input_node)
        workflow.add_node("extract_intent", self.extract_intent_node)
        workflow.add_node("validate_participants", self.validate_participants_node)
        workflow.add_node("create_meeting", self.create_meeting_node)
        workflow.add_node("send_invitations", self.send_invitations_node)
        workflow.add_node("confirm_completion", self.confirm_completion_node)
        workflow.add_node("handle_error", self.handle_error_node)
        
        # Define edges
        workflow.add_edge("process_input", "extract_intent")
        
        # From extract_intent, route based on intent type
        workflow.add_conditional_edges(
            "extract_intent",
            self._route_from_extract_intent,
            {
                "schedule": "validate_participants",
                "other": "confirm_completion",
            }
        )
        
        # Validate participants conditional routing
        workflow.add_conditional_edges(
            "validate_participants",
            self._route_from_validate,
            {
                "valid": "create_meeting",
                "invalid": "handle_error",
            }
        )
        
        # Normal flow
        workflow.add_edge("create_meeting", "send_invitations")
        workflow.add_edge("send_invitations", "confirm_completion")
        workflow.add_edge("confirm_completion", END)
        
        # Error flow
        workflow.add_edge("handle_error", END)
        
        # Set entry point
        workflow.set_entry_point("process_input")
        
        self.graph = workflow.compile()
    
    def process_input_node(self, state: Dict[str, Any]) -> Dict[str, Any]:
        """Process the user input message"""
        logger.info(f"Processing input for user {self.user.username}")
        state["user_input"] = state.get("message", "")
        state["timestamp"] = datetime.now().isoformat()
        state["user_id"] = self.user.id
        
        # Load conversation history for context (last 3 messages before current message)
        session_id = state.get("session_id", "")
        if session_id:
            try:
                # Get last 3 messages from this session for context
                chat_messages = ChatMessage.objects.filter(
                    session_id=session_id,
                    user=self.user
                ).order_by('-created_at')[:3]  # Last 3 messages, most recent first
                
                # Reverse to get chronological order (oldest to newest)
                chat_messages = list(reversed(chat_messages))
                
                state["conversation_history"] = [
                    {
                        "role": msg.role,
                        "content": msg.content,
                        "created_at": msg.created_at.isoformat()
                    }
                    for msg in chat_messages
                ]
                logger.info(f"Loaded {len(state['conversation_history'])} messages for context")
            except Exception as e:
                logger.warning(f"Could not load conversation history: {str(e)}")
                state["conversation_history"] = []
        else:
            state["conversation_history"] = []
        
        return state
    
    def extract_intent_node(self, state: Dict[str, Any]) -> Dict[str, Any]:
        """Extract intent and details using LLM - AI-driven analysis"""
        user_input = state.get("user_input", "")
        conversation_history = state.get("conversation_history", [])
        
        # Build conversation context for LLM
        history_context = ""
        if conversation_history:
            history_context = "\n\nPrevious conversation:\n"
            for msg in conversation_history:
                role_label = "👤 User" if msg["role"] == "user" else "🤖 Assistant"
                history_context += f"{role_label}: {msg['content']}\n"
        
        # LLM analyzes intent and extracts ALL details intelligently
        system_prompt = """You are an intelligent AI assistant for meeting scheduling and general help.

ANALYZE the user's intent carefully:

1. Is user mentioning scheduling/meeting? → intent="schedule"
   - Extract: meeting_title, participant_names, meeting_time, agenda
   - List missing_details so you can ask follow-ups
   
2. Otherwise → intent="other"
   - Just analyze normally

CRITICAL RULES:
- Only set intent="schedule" if user EXPLICITLY mentions: schedule, meeting, call, invite, sync, standup, 1:1, conference, arrange, book
- Time mentions ALONE (like "5pm") don't make it a meeting unless context suggests it
- Extract participant names ACCURATELY from conversation
- If previous messages mentioned details, INCLUDE them in extraction (merge memory!)

RESPOND WITH PURE JSON (no markdown, no extra text):

{"intent": "schedule" or "other", "meeting_title": "...", "participant_names": [...], "meeting_time": "...", "agenda": "...", "missing_details": [...], "reasoning": "why you chose this intent"}

EXAMPLES:
Input: "hi" → {"intent": "other", ...}
Input: "schedule meeting" → {"intent": "schedule", "participant_names": [], "meeting_time": "TBD", "missing_details": ["time", "participants"], ...}
Input: "with john tomorrow at 2pm" → {"intent": "schedule", "participant_names": ["john"], "meeting_time": "tomorrow at 2pm", ...}
Input: "what's the weather?" → {"intent": "other", ...}"""
        
        try:
            if not self.llm:
                logger.error("⚠️ LLM NOT INITIALIZED - using fallback")
                response_text = self._simple_intent_extraction(user_input)
            else:
                # LLM analyze with full context
                messages = [
                    SystemMessage(content=system_prompt),
                    HumanMessage(content=f"{history_context}\n\nCurrent user message: {user_input}")
                ]
                response = self.llm.invoke(messages)
                response_text = response.content.strip()
                
                logger.info(f"🤖 LLM Intent Analysis: {response_text[:200]}")
                
                # Clean markdown if LLM wrapped it
                if response_text.startswith("```"):
                    response_text = response_text.split("```")[1]
                    if response_text.startswith("json"):
                        response_text = response_text[4:]
                    response_text = response_text.strip()
                
                # Extract JSON safely
                if "{" in response_text and "}" in response_text:
                    start_idx = response_text.index("{")
                    end_idx = response_text.rindex("}") + 1
                    response_text = response_text[start_idx:end_idx]
                
                logger.info(f"✅ Extracted JSON: {response_text[:150]}")
            
            # Parse JSON response
            intent_data = json.loads(response_text)
            state["intent"] = intent_data.get("intent", "other")
            state["extracted_details"] = intent_data
            
            logger.info(f"📊 Intent: {state['intent']}, Reasoning: {intent_data.get('reasoning', 'N/A')}")
            
        except json.JSONDecodeError as e:
            logger.warning(f"❌ JSON parse error: {str(e)[:100]}")
            response_text = self._simple_intent_extraction(user_input)
            try:
                intent_data = json.loads(response_text)
                state["intent"] = intent_data.get("intent", "other")
                state["extracted_details"] = intent_data
            except:
                state["intent"] = "other"
                state["extracted_details"] = {"intent": "other"}
        except Exception as e:
            logger.error(f"❌ Intent extraction error: {str(e)}", exc_info=True)
            state["intent"] = "other"
            state["extracted_details"] = {"intent": "other"}
        
        return state
    
    def _simple_intent_extraction(self, user_input: str) -> str:
        """Improved fallback intent extraction - LESS aggressive"""
        input_lower = user_input.lower()
        
        # Meeting keywords - EXPLICIT mentions only
        meeting_keywords = [
            "schedule", "meeting", "call", "invite", "setup", "create", "arrange", "book",
            "sync", "standup", "all-hands", "1:1", "one-on-one", "conference", "gather"
        ]
        
        # Check for EXPLICIT meeting mention
        is_meeting = any(kw in input_lower for kw in meeting_keywords)
        
        if not is_meeting:
            # Simple "hi", "hello", etc. → NOT meeting
            logger.info(f"ℹ️ Fallback: No meeting keywords found → intent='other'")
            return json.dumps({"intent": "other"})
        
        # Has explicit meeting keyword - extract details
        words = user_input.split()
        names = []
        exclude_words = {"Schedule", "Meeting", "With", "For", "Tomorrow", "Today", "Monday",
                        "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday",
                        "I", "The", "A", "An", "Or", "And", "To", "At", "In", "On", "Time",
                        "Call", "Invite", "Get", "Please", "Thanks", "Hi", "Hello", "Call"}
        
        for word in words:
            if (word and word[0].isupper() and len(word) > 2 and 
                word not in exclude_words and word.isalpha()):
                names.append(word)
        
        unique_names = list(dict.fromkeys(names))
        
        logger.info(f"✅ Fallback: Meeting detected. Names: {unique_names}")
        return json.dumps({
            "intent": "schedule",
            "meeting_title": "Meeting",
            "participant_names": unique_names,
            "meeting_time": "TBD",
            "agenda": "",
            "missing_details": ["participants", "time", "agenda"]
        })
    
    def validate_participants_node(self, state: Dict[str, Any]) -> Dict[str, Any]:
        """Validate that all participants are registered users"""
        extracted = state.get("extracted_details", {})
        participant_names = extracted.get("participant_names", [])
        
        valid_participants = []
        invalid_participants = []
        
        logger.info(f"Validating {len(participant_names)} participants: {participant_names}")
        
        for name in participant_names:
            if not name or len(name.strip()) == 0:
                continue
                
            name_clean = name.strip()
            found = False
            
            # Search for team members with this name (exact or partial match)
            team_members = TeamMember.objects.filter(name__icontains=name_clean).order_by('name')
            logger.info(f"Found {len(team_members)} team members matching '{name_clean}'")
            
            if team_members.exists():
                member = team_members.first()
                
                # Try to find associated auth user by name
                first_name = name_clean.split()[0] if name_clean else ""
                auth_profile = AuthUserProfile.objects.filter(
                    user__first_name__iexact=first_name
                ).first()
                
                if auth_profile and auth_profile.email:
                    valid_participants.append({
                        "name": member.name,
                        "email": auth_profile.email,
                        "team_member_id": member.id,
                        "user_id": auth_profile.user.id
                    })
                    logger.info(f"Validated participant: {member.name} ({auth_profile.email})")
                    found = True
                else:
                    # Try to find user by first name in User model
                    try:
                        user_obj = User.objects.filter(first_name__iexact=first_name).first()
                        if user_obj and user_obj.email:
                            valid_participants.append({
                                "name": user_obj.get_full_name() or user_obj.username,
                                "email": user_obj.email,
                                "team_member_id": member.id,
                                "user_id": user_obj.id
                            })
                            logger.info(f"Validated participant via User model: {user_obj.get_full_name()} ({user_obj.email})")
                            found = True
                    except Exception as e:
                        logger.warning(f"Error finding user for {first_name}: {e}")
            
            if not found:
                invalid_participants.append(name_clean)
                logger.warning(f"Could not validate participant: {name_clean}")
        
        state["valid_participants"] = valid_participants
        state["invalid_participants"] = invalid_participants
        state["validation_status"] = "valid" if not invalid_participants else "invalid"
        
        logger.info(f"Validation result - Valid: {len(valid_participants)}, Invalid: {len(invalid_participants)}")
        
        return state
    
    def create_meeting_node(self, state: Dict[str, Any]) -> Dict[str, Any]:
        """Create meeting in database"""
        # Check validation status first
        validation_status = state.get("validation_status", "invalid")
        valid_participants = state.get("valid_participants", [])
        
        logger.info(f"Create meeting node - Validation: {validation_status}, Valid participants: {len(valid_participants)}")
        
        # If validation failed or no valid participants, don't create meeting
        if validation_status == "invalid" or not valid_participants:
            logger.info(f"Skipping meeting creation - validation_status: {validation_status}")
            state["meeting_created"] = False
            return state
        
        extracted = state.get("extracted_details", {})
        
        # Generate a meeting link
        meeting_id = str(uuid4())[:8]
        meeting_link = f"https://meet.google.com/{meeting_id}"
        
        try:
            # Get the organizer
            auth_profile = AuthUserProfile.objects.get(user=self.user)
            
            # Try to get TeamMember object for organizer
            organizer = TeamMember.objects.filter(name__icontains=self.user.first_name).first()
            
            # Parse meeting time with helper function
            meeting_time_str = extracted.get("meeting_time", "TBD")
            scheduled_datetime = self._parse_meeting_time(meeting_time_str)
            
            logger.info(f"Creating meeting with title: {extracted.get('meeting_title')}, time: {scheduled_datetime}, participants: {len(valid_participants)}")
            
            # Create meeting record
            meeting = Meeting.objects.create(
                title=extracted.get("meeting_title", "Meeting"),
                agenda=extracted.get("agenda", ""),
                scheduled_for=scheduled_datetime,
                duration_minutes=int(extracted.get("duration", "30")) if extracted.get("duration") else 30,
                meeting_link=meeting_link,
                organizer=organizer,
                status="scheduled"
            )
            
            logger.info(f"Meeting created with ID: {meeting.id}")
            
            # Add attendees
            added_count = 0
            for participant in valid_participants:
                try:
                    team_member = TeamMember.objects.get(id=participant["team_member_id"])
                    meeting.attendees.add(team_member)
                    added_count += 1
                    logger.info(f"Added attendee: {team_member.name}")
                except Exception as e:
                    logger.warning(f"Could not add attendee {participant.get('name')}: {e}")
            
            logger.info(f"Added {added_count} attendees to meeting")
            
            state["meeting"] = {
                "id": meeting.id,
                "title": meeting.title,
                "link": meeting_link,
                "scheduled_for": scheduled_datetime.isoformat()
            }
            state["meeting_created"] = True
            
            logger.info(f"Meeting successfully created: {meeting.id}")
            
        except Exception as e:
            logger.error(f"Error creating meeting: {str(e)}", exc_info=True)
            state["error"] = f"Failed to create meeting: {str(e)}"
            state["meeting_created"] = False
            state["validation_status"] = "invalid"
        
        return state
    
    def _parse_meeting_time(self, time_str: str) -> datetime:
        """Parse meeting time string to datetime with intelligent handling"""
        import re
        from dateutil import parser as date_parser
        
        if not time_str or time_str.upper() == "TBD":
            # Default to 2 PM tomorrow
            tomorrow = datetime.now().replace(hour=14, minute=0, second=0, microsecond=0)
            tomorrow = tomorrow.replace(day=tomorrow.day + 1) if tomorrow.hour > 14 else tomorrow
            logger.info(f"No time specified, defaulting to: {tomorrow}")
            return tomorrow
        
        time_str = time_str.strip().lower()
        now = datetime.now()
        
        try:
            # Handle "today 6 pm", "today at 6 pm", "6 pm today", etc.
            if "today" in time_str:
                # Extract time part
                time_part = re.sub(r'today|at|\s+', ' ', time_str).strip()
                try:
                    parsed_time = date_parser.parse(time_part, fuzzy=True)
                    # Use today's date with extracted time
                    result = now.replace(
                        hour=parsed_time.hour,
                        minute=parsed_time.minute,
                        second=0,
                        microsecond=0
                    )
                    # If time is in the past, move to tomorrow
                    if result < now:
                        result = result.replace(day=result.day + 1)
                    logger.info(f"Parsed 'today' time: {result}")
                    return result
                except Exception as e:
                    logger.warning(f"Could not parse time from 'today': {time_str}, error: {e}")
            
            # Handle "tomorrow 6 pm", "tomorrow at 6 pm", etc.
            if "tomorrow" in time_str:
                time_part = re.sub(r'tomorrow|at|\s+', ' ', time_str).strip()
                try:
                    parsed_time = date_parser.parse(time_part, fuzzy=True)
                    result = now.replace(
                        day=now.day + 1,
                        hour=parsed_time.hour,
                        minute=parsed_time.minute,
                        second=0,
                        microsecond=0
                    )
                    logger.info(f"Parsed 'tomorrow' time: {result}")
                    return result
                except Exception as e:
                    logger.warning(f"Could not parse time from 'tomorrow': {time_str}, error: {e}")
            
            # Handle day names: "monday 6 pm", "thursday at 2 pm", etc.
            day_names = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
            for day_name in day_names:
                if day_name in time_str:
                    time_part = re.sub(r'|'.join(day_names) + r'|at|\s+', ' ', time_str).strip()
                    try:
                        parsed_time = date_parser.parse(time_part, fuzzy=True)
                        # Parse the specific day
                        parsed_date = date_parser.parse(time_str, fuzzy=True)
                        result = parsed_date.replace(
                            hour=parsed_time.hour if parsed_time.hour != 0 else 14,
                            minute=parsed_time.minute,
                            second=0,
                            microsecond=0
                        )
                        # Ensure it's in the future
                        if result < now:
                            # Add 7 days to go to next week
                            result = result.replace(day=result.day + 7)
                        logger.info(f"Parsed day name time: {result}")
                        return result
                    except Exception as e:
                        logger.warning(f"Could not parse day name: {time_str}, error: {e}")
            
            # Try general fuzzy parsing
            try:
                parsed = date_parser.parse(time_str, fuzzy=True, default=now.replace(hour=14, minute=0))
                # Ensure time is in future
                if parsed < now:
                    parsed = parsed.replace(day=parsed.day + 1)
                logger.info(f"Parsed with fuzzy parser: {parsed}")
                return parsed
            except Exception as e:
                logger.warning(f"Fuzzy parse failed: {time_str}, error: {e}")
            
            # All parsing failed, default to 2 PM today
            result = now.replace(hour=18, minute=0, second=0, microsecond=0)
            if result < now:
                result = result.replace(day=result.day + 1)
            logger.warning(f"All parsing failed for '{time_str}', defaulting to {result}")
            return result
            
        except Exception as e:
            logger.error(f"Unexpected error parsing time '{time_str}': {str(e)}", exc_info=True)
            # Ultimate fallback: 2 PM tomorrow
            result = now.replace(hour=14, minute=0, second=0, microsecond=0)
            result = result.replace(day=result.day + 1)
            return result
    
    def send_invitations_node(self, state: Dict[str, Any]) -> Dict[str, Any]:
        """Send meeting invitations via email"""
        if not state.get("meeting_created"):
            return state
        
        valid_participants = state.get("valid_participants", [])
        meeting = state.get("meeting", {})
        
        if not valid_participants or not meeting:
            return state
        
        # Format time nicely for email
        try:
            scheduled_time = datetime.fromisoformat(meeting["scheduled_for"])
            meeting_time_str = scheduled_time.strftime("%B %d, %Y at %I:%M %p")
        except:
            meeting_time_str = "Soon"
        
        # Get organizer name
        auth_profile = AuthUserProfile.objects.get(user=self.user)
        organizer_name = auth_profile.full_name or self.user.get_full_name() or self.user.username
        
        # Prepare recipient list
        recipient_list = [
            {
                "email": p["email"],
                "name": p["name"]
            }
            for p in valid_participants if p.get("email")
        ]
        
        # Send invitations
        results = send_bulk_meeting_invitations(
            recipient_list=recipient_list,
            meeting_title=meeting["title"],
            meeting_time=meeting_time_str,
            meeting_link=meeting["link"],
            organizer_name=organizer_name
        )
        
        state["email_results"] = results
        logger.info(f"Emails sent: {len(results['sent'])}, Failed: {len(results['failed'])}")
        
        return state
    
    def confirm_completion_node(self, state: Dict[str, Any]) -> Dict[str, Any]:
        """Generate AI-driven responses - no hardcoded templates"""
        user_input = state.get("user_input", "")
        extracted = state.get("extracted_details", {})
        intent = state.get("intent", "other")
        conversation_history = state.get("conversation_history", [])
        
        logger.info(f"🎯 Confirm completion - Intent: {intent}, Meeting created: {state.get('meeting_created')}")
        
        # For meeting scheduling flow
        if intent == "schedule":
            valid_participants = state.get("valid_participants", [])
            invalid_participants = state.get("invalid_participants", [])
            
            # If missing participants
            if not valid_participants and invalid_participants:
                response = self._ai_generate_response(
                    user_input=user_input,
                    conversation_history=conversation_history,
                    context=f"Could not find these participants: {', '.join(invalid_participants)}. Ask if they meant different names or to register them.",
                    instruction="Generate a helpful response asking about the invalid participants"
                )
                state["response"] = response
                state["meeting_scheduled"] = False
                return state
            
            # Check if meeting was created successfully
            if state.get("meeting_created"):
                results = state.get("email_results", {})
                meeting = state.get("meeting", {})
                
                response = self._ai_generate_response(
                    user_input=user_input,
                    conversation_history=conversation_history,
                    context=f"Meeting '{meeting.get('title')}' scheduled for {meeting.get('scheduled_for')} with {len(valid_participants)} participants. Meeting link: {meeting.get('link')}",
                    instruction="Generate a friendly confirmation message with emojis showing the meeting was scheduled successfully"
                )
                state["response"] = response
                state["meeting_scheduled"] = True
                logger.info(f"✅ Meeting scheduled successfully!")
                return state
            
            # Meeting NOT created - need more details
            missing_details = extracted.get("missing_details", [])
            
            # Build context about what we know
            known_info = []
            if extracted.get("meeting_title"):
                known_info.append(f"Title: {extracted['meeting_title']}")
            if extracted.get("meeting_time"):
                known_info.append(f"Time: {extracted['meeting_time']}")
            if extracted.get("agenda"):
                known_info.append(f"Agenda: {extracted['agenda']}")
            if valid_participants:
                names = [p["name"] for p in valid_participants]
                known_info.append(f"Participants: {', '.join(names)}")
            
            known_str = "\n".join(known_info) if known_info else "No details captured yet"
            
            response = self._ai_generate_response(
                user_input=user_input,
                conversation_history=conversation_history,
                context=f"Scheduling a meeting. Known details:\n{known_str}\nMissing details: {', '.join(missing_details) if missing_details else 'Need to complete meeting'}",
                instruction="Ask a natural follow-up question to get the next missing detail. Be conversational and helpful. Don't ask for everything at once."
            )
            state["response"] = response
            state["meeting_scheduled"] = False
            logger.info(f"❓ Asked follow-up for missing details")
            return state
        
        # For general questions (intent="other")
        response = self._ai_generate_response(
            user_input=user_input,
            conversation_history=conversation_history,
            context="User is asking a general question",
            instruction="Provide a helpful, natural response. If it's vaguely meeting-related, offer to help schedule. Keep it conversational."
        )
        state["response"] = response
        state["meeting_scheduled"] = False
        logger.info(f"💬 Generated general AI response")
        return state
    
    def _ai_generate_response(self, user_input: str, conversation_history: List[Dict], 
                            context: str, instruction: str) -> str:
        """Generate AI response using LLM - ALWAYS called"""
        
        # Build conversation context
        history_context = ""
        if conversation_history:
            history_context = "\n\nConversation history:\n"
            for msg in conversation_history[-5:]:  # Last 5 messages for context
                role_label = "👤 User" if msg["role"] == "user" else "🤖 Assistant"
                history_context += f"{role_label}: {msg['content']}\n"
        
        system_prompt = f"""You are a helpful, friendly AI assistant.

{instruction}

IMPORTANT:
- Be conversational and natural
- Keep responses concise (2-3 sentences max)
- Use simple language
- Be warm and helpful
- If user is frustrated, be empathetic

Current context: {context}"""
        
        try:
            if not self.llm:
                logger.warning("⚠️ LLM not available - returning generic response")
                return "I'm here to help! How can I assist you?"
            
            messages = [
                SystemMessage(content=system_prompt),
                HumanMessage(content=f"{history_context}\nUser just said: {user_input}")
            ]
            
            response = self.llm.invoke(messages)
            response_text = response.content.strip()
            
            logger.info(f"✅ AI Generated: {response_text[:100]}")
            return response_text
            
        except Exception as e:
            logger.error(f"❌ Error generating response: {str(e)}", exc_info=True)
            return "I'm here to help! Could you rephrase that?"
    
    def handle_error_node(self, state: Dict[str, Any]) -> Dict[str, Any]:
        """Handle errors with AI-generated responses"""
        invalid = state.get("invalid_participants", [])
        user_input = state.get("user_input", "")
        conversation_history = state.get("conversation_history", [])
        
        if invalid:
            context = f"Participants not found in system: {', '.join(invalid)}"
            response = self._ai_generate_response(
                user_input=user_input,
                conversation_history=conversation_history,
                context=context,
                instruction="Politely explain which participants weren't found and ask if they'd like to try different names or register them first."
            )
        else:
            response = self._ai_generate_response(
                user_input=user_input,
                conversation_history=conversation_history,
                context="An error occurred processing the request",
                instruction="Apologize briefly and offer to help in a different way"
            )
        
        state["response"] = response
        state["meeting_scheduled"] = False
        logger.warning(f"⚠️ Error handled with AI response")
        return state
    
    def _route_from_extract_intent(self, state: Dict[str, Any]) -> str:
        """Route based on extracted intent"""
        return state.get("intent", "other")
    
    def _route_from_validate(self, state: Dict[str, Any]) -> str:
        """Route based on validation result"""
        return state.get("validation_status", "invalid")
    
    def run(self, user_message: str, session_id: str = "") -> str:
        """
        Run the agent with a user message
        
        Args:
            user_message: The user's chat message
            session_id: The chat session ID for context
        
        Returns:
            str: The agent's response
        """
        input_state = {
            "message": user_message,
            "session_id": session_id,
            "messages": []
        }
        
        try:
            output = self.graph.invoke(input_state)
            return output.get("response", "Unable to process request.")
        except Exception as e:
            logger.error(f"Error running agent: {str(e)}")
            return f"An error occurred: {str(e)}"
