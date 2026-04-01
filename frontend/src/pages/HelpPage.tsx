import { useEffect, useState } from "react";
import { LifeBuoy, Mail, MessageCircleQuestion, Send, Sparkles } from "lucide-react";
import { TopNav } from "@/components/TopNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/api";
import { toast } from "@/components/ui/sonner";

export function HelpPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const guides = [
    {
      title: "Create your first task",
      steps: [
        "Open Tasks and select New Task.",
        "Add a title, due date, and priority.",
        "Assign the task to a teammate and save it.",
      ],
    },
    {
      title: "Set up a project",
      steps: [
        "Choose New Project from the sidebar.",
        "Add a project summary, timeline, and owner.",
        "Link tasks to the project so progress stays visible.",
      ],
    },
    {
      title: "Keep work moving",
      steps: [
        "Use the board to move tasks between statuses.",
        "Review meetings and deadlines from the dashboard.",
        "Update completed work to keep project health accurate.",
      ],
    },
  ];

  const faqs = [
    {
      question: "How do I edit an existing task?",
      answer: "Open the task list or board, select the task card, make your changes, and save.",
    },
    {
      question: "Why can I view a department but not change it?",
      answer: "Some departments are view only. You can still review tasks and projects, but editing is limited to your default department.",
    },
    {
      question: "Can I connect tasks to projects?",
      answer: "Yes. When creating or editing a task, choose the related project so it appears in project views and progress tracking.",
    },
    {
      question: "Where can I update my profile details?",
      answer: "Go to Settings to change your name and review your account information.",
    },
  ];

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const profile = await api.getUserProfile();
        const profileName = `${profile.first_name} ${profile.last_name}`.trim();
        setName(profileName);
        setEmail(profile.email);
      } catch (error) {
        console.error("Failed to load profile for help form", error);
      }
    };

    void loadProfile();
  }, []);

  const handleSubmit = async () => {
    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    const trimmedMessage = message.trim();

    if (!trimmedName || !trimmedEmail || !trimmedMessage) {
      toast.error("Please complete name, email, and message before sending.");
      return;
    }

    setIsSubmitting(true);
    try {
      await api.createContactMessage({
        name: trimmedName,
        email: trimmedEmail,
        message: trimmedMessage,
      });
      setMessage("");
      toast.success("Your support message has been sent.");
    } catch (error) {
      console.error("Failed to submit contact message", error);
      toast.error(error instanceof Error ? error.message : "Could not send your message");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex h-full flex-col">
      <TopNav title="Help" />
      <div className="flex-1 overflow-auto p-5 md:p-6">
        <div className="mx-auto max-w-5xl space-y-5">
          <section className="dashboard-panel overflow-hidden">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.22em] text-muted-foreground">Support center</p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight text-foreground">How can we help?</h2>
                <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                  Browse quick guides, common questions, and simple contact options for the TaskFlow workspace.
                </p>
              </div>
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/5 px-3 py-1.5 text-xs font-medium text-primary">
                <Sparkles className="h-3.5 w-3.5" />
                Help is organized for quick answers
              </div>
            </div>
          </section>

          <div className="grid gap-5 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
            <section className="dashboard-panel">
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <LifeBuoy className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground">Guides</h3>
                  <p className="text-sm text-muted-foreground">Start with the basics for tasks, projects, and daily workflow.</p>
                </div>
              </div>

              <div className="grid gap-3">
                {guides.map((guide) => (
                  <article key={guide.title} className="rounded-2xl border border-border/60 bg-card/80 p-4 shadow-sm">
                    <h4 className="text-sm font-semibold text-foreground">{guide.title}</h4>
                    <ol className="mt-3 space-y-2 text-sm text-muted-foreground">
                      {guide.steps.map((step, index) => (
                        <li key={step} className="flex gap-3">
                          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                            {index + 1}
                          </span>
                          <span className="pt-0.5">{step}</span>
                        </li>
                      ))}
                    </ol>
                  </article>
                ))}
              </div>
            </section>

            <div className="space-y-5">
              <section className="dashboard-panel">
                <div className="mb-5 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <MessageCircleQuestion className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">FAQ</h3>
                    <p className="text-sm text-muted-foreground">Answers to common questions from everyday use.</p>
                  </div>
                </div>

                <div className="space-y-3">
                  {faqs.map((item) => (
                    <article key={item.question} className="rounded-2xl border border-border/60 bg-card/70 p-4">
                      <h4 className="text-sm font-semibold text-foreground">{item.question}</h4>
                      <p className="mt-1.5 text-sm leading-6 text-muted-foreground">{item.answer}</p>
                    </article>
                  ))}
                </div>
              </section>

              <section className="dashboard-panel">
                <div className="mb-5 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Mail className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">Contact</h3>
                    <p className="text-sm text-muted-foreground">Reach support directly or leave a message for follow-up.</p>
                  </div>
                </div>

                <div className="rounded-2xl border border-border/60 bg-card/70 p-4">
                  <p className="text-sm text-muted-foreground">Email support</p>
                  <a
                    href="mailto:support@taskflow.app"
                    className="mt-1 inline-flex text-sm font-semibold text-primary underline-offset-4 transition hover:underline"
                  >
                    support@taskflow.app
                  </a>
                </div>

                <form
                  className="mt-4 space-y-3 rounded-2xl border border-border/60 bg-card/70 p-4"
                  onSubmit={(event) => {
                    event.preventDefault();
                    void handleSubmit();
                  }}
                >
                  <div className="space-y-2">
                    <label htmlFor="help-name" className="text-xs font-medium text-muted-foreground">
                      Name
                    </label>
                    <Input
                      id="help-name"
                      placeholder="Your name"
                      className="h-10 bg-background/80"
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                      disabled={isSubmitting}
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="help-email" className="text-xs font-medium text-muted-foreground">
                      Email
                    </label>
                    <Input
                      id="help-email"
                      type="email"
                      placeholder="you@company.com"
                      className="h-10 bg-background/80"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      disabled={isSubmitting}
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="help-message" className="text-xs font-medium text-muted-foreground">
                      Message
                    </label>
                    <Textarea
                      id="help-message"
                      placeholder="Tell us what you need help with."
                      className="min-h-28 resize-none bg-background/80"
                      value={message}
                      onChange={(event) => setMessage(event.target.value)}
                      disabled={isSubmitting}
                    />
                  </div>

                  <Button type="submit" className="h-10 rounded-lg gap-2" disabled={isSubmitting}>
                    <Send className="h-4 w-4" />
                    {isSubmitting ? "Sending..." : "Send Message"}
                  </Button>
                </form>
              </section>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
