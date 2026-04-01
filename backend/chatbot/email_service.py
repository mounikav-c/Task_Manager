import smtplib
import os
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from django.conf import settings
from datetime import datetime
import logging

logger = logging.getLogger(__name__)


def send_meeting_invitation(recipient_email: str, recipient_name: str, meeting_title: str, 
                           meeting_time: str, meeting_link: str, organizer_name: str) -> bool:
    """
    Send meeting invitation email via Gmail SMTP
    
    Args:
        recipient_email: Email address of meeting attendee
        recipient_name: Name of attendee
        meeting_title: Title of the meeting
        meeting_time: Scheduled time of the meeting
        meeting_link: Video call link (Google Meet, Zoom, etc.)
        organizer_name: Name of the person scheduling the meeting
    
    Returns:
        bool: True if email sent successfully, False otherwise
    """
    try:
        # Get Gmail credentials from environment
        sender_email = os.getenv("GMAIL_EMAIL", "")
        app_password = os.getenv("GMAIL_APP_PASSWORD", "")
        
        if not sender_email or not app_password:
            logger.warning("Gmail credentials not configured in environment variables")
            return False

        # Create email message
        message = MIMEMultipart("alternative")
        message["Subject"] = f"Meeting Scheduled: {meeting_title}"
        message["From"] = sender_email
        message["To"] = recipient_email

        # Create HTML email body
        html_body = f"""
        <html>
            <body style="font-family: Arial, sans-serif; color: #333;">
                <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h2 style="color: #2c3e50;">Meeting Invitation</h2>
                    
                    <p>Hi {recipient_name},</p>
                    
                    <p>{organizer_name} has scheduled a meeting with you.</p>
                    
                    <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <h3 style="margin: 0 0 10px 0; color: #2c3e50;">{meeting_title}</h3>
                        <p style="margin: 5px 0;"><strong>Time:</strong> {meeting_time}</p>
                        <p style="margin: 5px 0;"><strong>Organizer:</strong> {organizer_name}</p>
                    </div>
                    
                    <div style="margin: 20px 0;">
                        <a href="{meeting_link}" style="display: inline-block; background-color: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">
                            Join Meeting
                        </a>
                    </div>
                    
                    <p>Meeting Link: <a href="{meeting_link}">{meeting_link}</a></p>
                    
                    <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
                    <p style="font-size: 12px; color: #999;">
                        This is an automated message from TaskFlow Meeting Scheduler. Please do not reply to this email.
                    </p>
                </div>
            </body>
        </html>
        """
        
        # Create plain text alternative
        text_body = f"""
Meeting Invitation

Hi {recipient_name},

{organizer_name} has scheduled a meeting with you.

Meeting Title: {meeting_title}
Time: {meeting_time}
Organizer: {organizer_name}

Join the meeting: {meeting_link}

---
This is an automated message from TaskFlow Meeting Scheduler.
        """
        
        # Attach both plain text and HTML versions
        part1 = MIMEText(text_body, "plain")
        part2 = MIMEText(html_body, "html")
        message.attach(part1)
        message.attach(part2)

        # Send email via Gmail SMTP
        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
            server.login(sender_email, app_password)
            server.sendmail(sender_email, recipient_email, message.as_string())
        
        logger.info(f"Meeting invitation sent to {recipient_email}")
        return True
        
    except Exception as e:
        logger.error(f"Failed to send email to {recipient_email}: {str(e)}")
        return False


def send_bulk_meeting_invitations(recipient_list: list, meeting_title: str, 
                                 meeting_time: str, meeting_link: str, organizer_name: str) -> dict:
    """
    Send meeting invitations to multiple recipients
    
    Args:
        recipient_list: List of dicts with 'email' and 'name' keys
        meeting_title: Title of the meeting
        meeting_time: Scheduled time of the meeting
        meeting_link: Video call link
        organizer_name: Name of organizer
    
    Returns:
        dict: Statistics of sent/failed emails
    """
    results = {
        "sent": [],
        "failed": [],
        "total": len(recipient_list)
    }
    
    for recipient in recipient_list:
        email = recipient.get("email", "")
        name = recipient.get("name", "")
        
        if not email:
            results["failed"].append({"name": name, "reason": "No email provided"})
            continue
        
        success = send_meeting_invitation(
            email, name, meeting_title, meeting_time, meeting_link, organizer_name
        )
        
        if success:
            results["sent"].append(email)
        else:
            results["failed"].append({"email": email, "reason": "Failed to send"})
    
    return results
