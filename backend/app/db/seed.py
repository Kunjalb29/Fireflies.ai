"""
MeetMind Database Seed Script
Populates the database with realistic demo data for 6 meetings.
Run: python -m app.db.seed  (from the backend/ directory)
"""
import asyncio
import uuid
from datetime import datetime, timedelta, date
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
from sqlalchemy import text

# We import models after engine setup to avoid circular imports
DATABASE_URL = "sqlite+aiosqlite:///./meetmind.db"

engine = create_async_engine(DATABASE_URL, echo=False)
AsyncSessionLocal = async_sessionmaker(engine, expire_on_commit=False)


def uid():
    return str(uuid.uuid4())


def days_ago(n: int) -> datetime:
    return datetime.utcnow() - timedelta(days=n)


def weeks_ago(n: int) -> datetime:
    return datetime.utcnow() - timedelta(weeks=n)


DEFAULT_USER_ID = "00000000-0000-0000-0000-000000000001"


async def seed():
    from app.db.database import Base
    from app.models.models import (
        User, Meeting, Transcript, TranscriptSegment, Summary,
        ActionItem, Highlight, Tag, MeetingTag
    )

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with AsyncSessionLocal() as db:
        # ── Check if already seeded ─────────────────────────────────────────
        from sqlalchemy import select
        existing = await db.execute(select(User).where(User.id == DEFAULT_USER_ID))
        if existing.scalar_one_or_none():
            print("Database already seeded. Skipping.")
            return

        # ── User ────────────────────────────────────────────────────────────
        user = User(
            id=DEFAULT_USER_ID,
            email="demo@meetmind.ai",
            name="Alex Chen",
            avatar_url=None,
            plan="pro",
        )
        db.add(user)
        await db.flush()

        # ── Tags ────────────────────────────────────────────────────────────
        tag_product = Tag(id=uid(), name="Product", color="#6C47FF")
        tag_engineering = Tag(id=uid(), name="Engineering", color="#00C2FF")
        tag_client = Tag(id=uid(), name="Client", color="#22C55E")
        tag_design = Tag(id=uid(), name="Design", color="#F59E0B")
        for t in [tag_product, tag_engineering, tag_client, tag_design]:
            db.add(t)
        await db.flush()

        # ════════════════════════════════════════════════════════════════════
        # MEETING 1: Q3 Product Roadmap Review
        # ════════════════════════════════════════════════════════════════════
        m1_id = uid()
        m1 = Meeting(
            id=m1_id, user_id=DEFAULT_USER_ID,
            title="Q3 Product Roadmap Review",
            date=days_ago(3), duration_secs=2820,
            status="processed",
            participants=["Alex Chen", "Priya Sharma", "Marcus Lee", "Jordan Williams"],
        )
        db.add(m1)
        await db.flush()

        t1_id = uid()
        t1 = Transcript(
            id=t1_id, meeting_id=m1_id,
            raw_text="Q3 Product Roadmap Review transcript",
            word_count=3200,
        )
        db.add(t1)
        await db.flush()

        m1_segments = [
            (uid(), t1_id, "Alex Chen", "alex@meetmind.ai", 0.0, 45.0,
             "Welcome everyone to our Q3 product roadmap review. We've got a packed agenda today — feature prioritization, the mobile app timeline, API rate limiting, and design system consolidation. Let's make sure we leave with clear owners on everything.", 0),
            (uid(), t1_id, "Priya Sharma", "priya@meetmind.ai", 47.0, 112.0,
             "Thanks Alex. I want to start by flagging that the design system work is really bottlenecking us on the mobile side. We have three engineers waiting on finalized components and it's starting to slip the Q4 target.", 1),
            (uid(), t1_id, "Marcus Lee", "marcus@meetmind.ai", 115.0, 180.0,
             "Yeah, I can second that from the engineering side. We're, uh, we're essentially blocked on two features because the component specs aren't finalized. I know it's not anyone's fault but we need to prioritize this.", 2),
            (uid(), t1_id, "Jordan Williams", "jordan@meetmind.ai", 182.0, 240.0,
             "From a product perspective, the mobile app is a top-three priority for Q4. We have commitments to at least two enterprise customers who specifically asked about mobile. So yeah, this needs to move fast.", 3),
            (uid(), t1_id, "Alex Chen", "alex@meetmind.ai", 242.0, 310.0,
             "Okay, let's make this concrete. Priya, what do you need to unblock the design system work? And what's a realistic timeline if we cleared your plate this week?", 4),
            (uid(), t1_id, "Priya Sharma", "priya@meetmind.ai", 312.0, 400.0,
             "Honestly, if I focus on nothing else, I can have the core component specs — buttons, inputs, cards, navigation — done by end of next week. The full system would take another two weeks after that. But the core is what engineering needs first.", 5),
            (uid(), t1_id, "Marcus Lee", "marcus@meetmind.ai", 402.0, 480.0,
             "That works for us. If we have the core specs by next Friday, we can start implementation and parallel-track the rest. I also want to raise the API rate limiting issue — we had three customers hit our limits this week and it's becoming a support burden.", 6),
            (uid(), t1_id, "Jordan Williams", "jordan@meetmind.ai", 482.0, 560.0,
             "The API rate limiting has been on my radar too. Do we have data on which endpoints are getting hit? Because my suspicion is it's the transcript processing endpoint more than anything else.", 7),
            (uid(), t1_id, "Marcus Lee", "marcus@meetmind.ai", 562.0, 640.0,
             "Correct. It's almost entirely the transcript endpoint. I've been thinking about a caching layer — if we cache processed transcripts for, say, 24 hours, we could reduce load by probably 60–70%. I'd want to spike it to confirm.", 8),
            (uid(), t1_id, "Alex Chen", "alex@meetmind.ai", 642.0, 720.0,
             "Let's do that spike. Marcus, can you scope it out this sprint? I want to understand the complexity before we commit. Now let's talk about the broader Q4 roadmap. Jordan, you've been doing the customer discovery calls — what's the signal?", 9),
            (uid(), t1_id, "Jordan Williams", "jordan@meetmind.ai", 722.0, 820.0,
             "The top three requests are: one, better search across transcripts — customers want Google-level search quality. Two, Slack integration for action item notifications. Three, mobile app. In that order, actually. Mobile is loud but search is the most commonly mentioned pain point.", 10),
            (uid(), t1_id, "Priya Sharma", "priya@meetmind.ai", 822.0, 900.0,
             "That's interesting because search is actually more feasible to ship in Q4 than mobile. We could do a really solid transcript search with highlighting and filters in maybe six weeks. Mobile is three months minimum.", 11),
            (uid(), t1_id, "Alex Chen", "alex@meetmind.ai", 902.0, 980.0,
             "Agreed. Let's revise the roadmap to prioritize search in Q4 and push mobile to Q1. Jordan, can you draft the updated PRD for mobile so we're ready to hit the ground running in January? And let's set search as our Q4 flagship feature.", 12),
            (uid(), t1_id, "Marcus Lee", "marcus@meetmind.ai", 982.0, 1060.0,
             "One more thing I want to raise — technical debt. We have a few areas that are slowing us down significantly. The authentication service is using a pattern we deprecated eight months ago and it's causing issues whenever we touch auth-related code.", 13),
            (uid(), t1_id, "Jordan Williams", "jordan@meetmind.ai", 1062.0, 1130.0,
             "How much time are we talking to fix it? And what's the risk of not fixing it? I want to make sure we're weighing this against feature work correctly.", 14),
            (uid(), t1_id, "Marcus Lee", "marcus@meetmind.ai", 1132.0, 1210.0,
             "Probably two weeks of focused work. Risk of not fixing it is accumulating technical debt that could cause a serious incident — we've already had two near-misses. I'd recommend scheduling it for early Q4 before we pile more features on top.", 15),
            (uid(), t1_id, "Alex Chen", "alex@meetmind.ai", 1212.0, 1290.0,
             "Okay, I hear you. Let's carve out the first two weeks of Q4 for technical debt and auth cleanup. Priya, can you make sure the design system work doesn't conflict with that window? And I'll update the roadmap doc today to reflect all of these decisions.", 16),
            (uid(), t1_id, "Priya Sharma", "priya@meetmind.ai", 1292.0, 1360.0,
             "I'll have the core component specs done before that window starts so there's no conflict. Should I also create a Figma board with the updated component states? That would help Marcus's team move faster.", 17),
            (uid(), t1_id, "Marcus Lee", "marcus@meetmind.ai", 1362.0, 1420.0,
             "Yes please, a Figma board would be incredibly helpful. Interactive prototypes even better if you have bandwidth.", 18),
            (uid(), t1_id, "Alex Chen", "alex@meetmind.ai", 1422.0, 1500.0,
             "Great. Let me summarize the decisions before we wrap up. Priya owns the design system core specs by next Friday. Marcus will spike API caching this sprint. Jordan will write the mobile PRD for Q1. I'll update the roadmap doc today. Q4 headline feature is transcript search. And we're reserving two weeks at the start of Q4 for technical debt. Does anyone have anything else?", 19),
            (uid(), t1_id, "Jordan Williams", "jordan@meetmind.ai", 1502.0, 1540.0,
             "No, I think that covers it. Good meeting everyone.", 20),
            (uid(), t1_id, "Priya Sharma", "priya@meetmind.ai", 1542.0, 1560.0,
             "Thanks all. I'll send over the Figma link as soon as the specs are ready.", 21),
        ]

        m1_seg_objects = []
        for seg_data in m1_segments:
            seg = TranscriptSegment(
                id=seg_data[0], transcript_id=seg_data[1],
                speaker_name=seg_data[2], speaker_email=seg_data[3],
                start_time=seg_data[4], end_time=seg_data[5],
                text=seg_data[6], segment_index=seg_data[7]
            )
            db.add(seg)
            m1_seg_objects.append(seg)
        await db.flush()

        # Summary for Meeting 1
        s1 = Summary(
            id=uid(), meeting_id=m1_id,
            overview="The Q3 Product Roadmap Review was a highly productive session where the team aligned on Q4 priorities and resolved several key blockers. The meeting surfaced critical dependencies between the design system and mobile development, leading to a decision to prioritize design system completion immediately. The team also agreed to reorder Q4 priorities with transcript search as the flagship feature and mobile app pushed to Q1. Technical debt remediation was formally scheduled for the first two weeks of Q4. Clear ownership was established for all decisions made during the session.",
            key_points=[
                "Design system core specs to be completed by Priya by end of next week to unblock engineering",
                "Mobile app timeline pushed to Q1; transcript search promoted as Q4 flagship feature",
                "Marcus will spike API caching layer to address rate limiting issues affecting enterprise customers",
                "Two weeks reserved at Q4 start for technical debt and authentication service cleanup",
                "Jordan to draft mobile PRD to ensure Q1 launch readiness",
                "Figma interactive prototypes to be created alongside component specs",
            ],
            chapters=[
                {"title": "Feature Prioritization", "start_seconds": 0, "summary": "Team reviewed design system blockers and established clear ownership. Priya committed to core specs by Friday, unblocking three engineers."},
                {"title": "Technical Debt Discussion", "start_seconds": 982, "summary": "Marcus raised authentication service technical debt risk. Team agreed to schedule two weeks of cleanup at start of Q4."},
                {"title": "Q4 Planning & Wrap-up", "start_seconds": 1212, "summary": "Final roadmap decisions summarized: search as Q4 hero feature, mobile to Q1, API caching spike, and roadmap doc update."},
            ],
            sentiment="positive",
        )
        db.add(s1)

        # Action Items for Meeting 1
        ai1_items = [
            ActionItem(id=uid(), meeting_id=m1_id, text="Complete design system core component specs (buttons, inputs, cards, nav)", assignee="Priya Sharma", due_date=date.today() + timedelta(days=5), priority="high", status="pending"),
            ActionItem(id=uid(), meeting_id=m1_id, text="Spike API caching layer for transcript endpoint — document complexity and estimated effort", assignee="Marcus Lee", due_date=date.today() + timedelta(days=7), priority="medium", status="pending"),
            ActionItem(id=uid(), meeting_id=m1_id, text="Write mobile app PRD for Q1 launch — include enterprise customer requirements", assignee="Jordan Williams", due_date=date.today() + timedelta(days=14), priority="medium", status="pending"),
            ActionItem(id=uid(), meeting_id=m1_id, text="Update Q3/Q4 roadmap doc to reflect all decisions from this meeting", assignee="Alex Chen", due_date=date.today() + timedelta(days=1), priority="high", status="in_progress"),
        ]
        for ai in ai1_items:
            db.add(ai)

        # Tags for Meeting 1
        db.add(MeetingTag(meeting_id=m1_id, tag_id=tag_product.id))
        db.add(MeetingTag(meeting_id=m1_id, tag_id=tag_engineering.id))

        await db.flush()

        # ════════════════════════════════════════════════════════════════════
        # MEETING 2: Weekly Engineering Standup
        # ════════════════════════════════════════════════════════════════════
        m2_id = uid()
        m2 = Meeting(
            id=m2_id, user_id=DEFAULT_USER_ID,
            title="Weekly Engineering Standup",
            date=days_ago(1), duration_secs=1080,
            status="processed",
            participants=["Alex Chen", "Diego Reyes", "Yuki Tanaka"],
        )
        db.add(m2)
        await db.flush()

        t2_id = uid()
        t2 = Transcript(id=t2_id, meeting_id=m2_id, raw_text="Standup transcript", word_count=980)
        db.add(t2)
        await db.flush()

        m2_segs = [
            (uid(), t2_id, "Alex Chen", "alex@meetmind.ai", 0.0, 30.0, "Quick standup everyone. Diego, you want to kick us off?", 0),
            (uid(), t2_id, "Diego Reyes", "diego@meetmind.ai", 32.0, 120.0, "Sure. Yesterday I finished the search endpoint refactor — it's in review now, PR #247. Today I'm working on the segment indexing performance issue. Blocker: I need the database query optimization guide that Marcus mentioned last week, haven't been able to track it down.", 1),
            (uid(), t2_id, "Alex Chen", "alex@meetmind.ai", 122.0, 145.0, "Marcus should be able to share that. I'll ping him after this. Yuki, you're up.", 2),
            (uid(), t2_id, "Yuki Tanaka", "yuki@meetmind.ai", 147.0, 240.0, "Yesterday I wrapped up the highlight color system implementation, all four colors working with the API. Today I'm starting on the transcript search UI — the highlighting and match navigation. No blockers, but I want to flag that the design mocks for search are a bit unclear on mobile layout. Can someone clarify?", 3),
            (uid(), t2_id, "Alex Chen", "alex@meetmind.ai", 242.0, 300.0, "I'll follow up with Priya on that and get you clarity by EOD. I wrapped up the CORS fix for the prod environment yesterday, deploy went smoothly. Today I'm reviewing PRs and working on the stats endpoint. My blocker is the staging environment is flaky — deployments are taking 3x longer than normal.", 4),
            (uid(), t2_id, "Diego Reyes", "diego@meetmind.ai", 302.0, 380.0, "I noticed that too. I think it's the Docker build cache issue we saw two weeks ago. I can take a quick look at the CI config if that helps.", 5),
            (uid(), t2_id, "Alex Chen", "alex@meetmind.ai", 382.0, 440.0, "That would be great Diego, add it to your plate if you have cycles. Let's talk PR reviews — we have four open PRs that have been sitting for more than two days. That's a problem for velocity.", 6),
            (uid(), t2_id, "Yuki Tanaka", "yuki@meetmind.ai", 442.0, 510.0, "I can review Diego's PR today. The search refactor is in my area anyway so it makes sense for me to look at it.", 7),
            (uid(), t2_id, "Diego Reyes", "diego@meetmind.ai", 512.0, 570.0, "Thanks Yuki. I'll review the one you posted yesterday — the highlight API integration. Should be straightforward.", 8),
            (uid(), t2_id, "Alex Chen", "alex@meetmind.ai", 572.0, 640.0, "Great. Last thing — we're targeting a deploy to prod on Thursday. Anything that might block that? Diego's PR and Yuki's current work both need to be merged and QA'd by Wednesday EOD.", 9),
            (uid(), t2_id, "Yuki Tanaka", "yuki@meetmind.ai", 642.0, 700.0, "I'll prioritize to make sure search UI is at least functionally complete by Wednesday. Some polish might slip to next sprint but the core functionality will be there.", 10),
            (uid(), t2_id, "Diego Reyes", "diego@meetmind.ai", 702.0, 750.0, "Same from my end. Search refactor is done, just needs review. I'll unblock Yuki's questions about the API contract first thing.", 11),
            (uid(), t2_id, "Alex Chen", "alex@meetmind.ai", 752.0, 790.0, "Perfect. Short one today. Let's get it done. See everyone tomorrow.", 12),
        ]

        for seg_data in m2_segs:
            seg = TranscriptSegment(id=seg_data[0], transcript_id=seg_data[1], speaker_name=seg_data[2], speaker_email=seg_data[3], start_time=seg_data[4], end_time=seg_data[5], text=seg_data[6], segment_index=seg_data[7])
            db.add(seg)
        await db.flush()

        s2 = Summary(
            id=uid(), meeting_id=m2_id,
            overview="A focused engineering standup covering current work in progress, blockers, and PR review assignments. The team is tracking toward a Thursday production deploy. Two blockers were identified and immediately assigned for resolution. PR review throughput was flagged as a velocity risk and addressed with explicit assignments.",
            key_points=[
                "Diego's search endpoint refactor (PR #247) ready for review — Yuki assigned",
                "Staging CI/CD flakiness identified — Diego to investigate Docker build cache",
                "Mobile layout designs for search UI need clarification — Alex to follow up with Priya",
                "Thursday production deploy target confirmed — code freeze Wednesday EOD",
            ],
            chapters=[
                {"title": "Individual Updates & Blockers", "start_seconds": 0, "summary": "Each engineer shared yesterday's progress, today's plan, and any blockers."},
                {"title": "PR Reviews & Deploy Planning", "start_seconds": 382, "summary": "PR assignments made and Thursday deploy target confirmed with Wednesday code freeze."},
            ],
            sentiment="neutral",
        )
        db.add(s2)

        ai2_items = [
            ActionItem(id=uid(), meeting_id=m2_id, text="Share database query optimization guide with Diego", assignee="Alex Chen", due_date=date.today(), priority="medium", status="done"),
            ActionItem(id=uid(), meeting_id=m2_id, text="Investigate CI/CD Docker build cache issue causing slow staging deploys", assignee="Diego Reyes", due_date=date.today() + timedelta(days=2), priority="medium", status="in_progress"),
        ]
        for ai in ai2_items:
            db.add(ai)

        db.add(MeetingTag(meeting_id=m2_id, tag_id=tag_engineering.id))
        await db.flush()

        # ════════════════════════════════════════════════════════════════════
        # MEETING 3: Client Onboarding — Acme Corp
        # ════════════════════════════════════════════════════════════════════
        m3_id = uid()
        m3 = Meeting(
            id=m3_id, user_id=DEFAULT_USER_ID,
            title="Client Onboarding — Acme Corp",
            date=days_ago(7), duration_secs=3720,
            status="processed",
            participants=["Alex Chen", "Sarah Mitchell", "Tom Nguyen"],
        )
        db.add(m3)
        await db.flush()

        t3_id = uid()
        t3 = Transcript(id=t3_id, meeting_id=m3_id, raw_text="Acme onboarding transcript", word_count=4100)
        db.add(t3)
        await db.flush()

        m3_segs = [
            (uid(), t3_id, "Alex Chen", "alex@meetmind.ai", 0.0, 60.0, "Welcome Sarah, welcome Tom! Really glad to have Acme Corp as part of the MeetMind family. Today's call is all about making sure you get maximum value from day one. We'll cover your use cases, walk through the platform, and set up a success plan together.", 0),
            (uid(), t3_id, "Sarah Mitchell", "sarah@acmecorp.com", 62.0, 150.0, "Thanks Alex, we're excited to get started. Just to give you context — we run about 200 meetings per week across our organization. Everything from executive syncs to client calls to engineering standups. The main pain point right now is that action items get lost after calls. Nobody's tracking them consistently.", 1),
            (uid(), t3_id, "Tom Nguyen", "tom@acmecorp.com", 152.0, 220.0, "Yeah, and we've tried a couple of solutions before but the adoption was terrible because they required too much manual work. People just won't do it if it adds friction. The value proposition of MeetMind is the automation — we want to see that working first.", 2),
            (uid(), t3_id, "Alex Chen", "alex@meetmind.ai", 222.0, 310.0, "That's exactly what we hear from most customers. The friction problem is real and that's why we built automatic action item extraction. It works right from the transcript — no tagging required. Let me show you how it works with one of your recent transcripts if you have one handy.", 3),
            (uid(), t3_id, "Sarah Mitchell", "sarah@acmecorp.com", 312.0, 390.0, "We do actually — I brought a sample from last week's leadership team meeting. I'll share the file now. It's about an hour long, typical leadership sync.", 4),
            (uid(), t3_id, "Alex Chen", "alex@meetmind.ai", 392.0, 480.0, "Perfect. While you're doing that — Tom, you mentioned integration. Can you tell me more about your current tool stack? We integrate with Slack, Google Workspace, HubSpot, and Zoom, among others.", 5),
            (uid(), t3_id, "Tom Nguyen", "tom@acmecorp.com", 482.0, 580.0, "We're a heavy Google Workspace shop. Google Meet for video, Gmail, Drive, and we use Slack for async communication. Salesforce for CRM — that integration would be a game-changer for our sales team calls. And we use Jira for project management.", 6),
            (uid(), t3_id, "Alex Chen", "alex@meetmind.ai", 582.0, 660.0, "Great news — Google Meet and Slack are available now. Salesforce and Jira are on our integration roadmap for Q4. I'll make sure you get early access when those ship. Let me show you the Google Meet setup — it takes about three minutes.", 7),
            (uid(), t3_id, "Sarah Mitchell", "sarah@acmecorp.com", 662.0, 750.0, "Three minutes sounds too good to be true. What's the setup process? Do we need IT involvement? We have a fairly strict approval process for new tools.", 8),
            (uid(), t3_id, "Alex Chen", "alex@meetmind.ai", 752.0, 840.0, "No IT involvement needed for the core product. The Google Meet integration is OAuth-based, so each user authorizes with their Google account. For SSO and advanced security controls, we do have an IT admin flow, but it's optional. I'll share the security documentation — that usually satisfies IT reviews quickly.", 9),
            (uid(), t3_id, "Tom Nguyen", "tom@acmecorp.com", 842.0, 930.0, "That's helpful. What about data privacy? We handle some sensitive client conversations and we need to be sure about data handling. Are transcripts stored encrypted? Where are your servers located?", 10),
            (uid(), t3_id, "Alex Chen", "alex@meetmind.ai", 932.0, 1020.0, "All data is encrypted at rest with AES-256 and in transit with TLS 1.3. Our servers are in US-East and US-West AWS regions, with EU-West available for EU customers. We're SOC 2 Type II compliant and GDPR-ready. I'll send over our security whitepaper after this call.", 11),
            (uid(), t3_id, "Sarah Mitchell", "sarah@acmecorp.com", 1022.0, 1110.0, "That covers our main concerns. Let's talk about rollout. We're thinking about starting with just the leadership team — about 15 people — and if that goes well, expanding to the full organization in Q4.", 12),
            (uid(), t3_id, "Alex Chen", "alex@meetmind.ai", 1112.0, 1200.0, "That's a smart approach. What I'd recommend is a 30-day success sprint with your leadership team. We set three goals, I check in with you bi-weekly, and at day 30 we do a value assessment. If the metrics look good, expansion becomes an easy decision.", 13),
            (uid(), t3_id, "Tom Nguyen", "tom@acmecorp.com", 1202.0, 1280.0, "I like that structure. What metrics do you track to measure success? I'll need to show ROI to our CFO when we go for the full org expansion.", 14),
            (uid(), t3_id, "Alex Chen", "alex@meetmind.ai", 1282.0, 1380.0, "Great question. The three metrics we track are: action item completion rate — we've seen customers go from 35% to 78% completion in the first month. Meeting time saved — average is 40 minutes per meeting when teams use the automated summaries. And search usage — how often people find past decisions without calling another meeting. I'll set up a dashboard for you to track these in real time.", 15),
            (uid(), t3_id, "Sarah Mitchell", "sarah@acmecorp.com", 1382.0, 1460.0, "Those metrics are exactly what our leadership team cares about. Let's commit to the 30-day sprint. Can we start with a training session for the 15 leaders? Maybe a 45-minute webinar?", 16),
            (uid(), t3_id, "Alex Chen", "alex@meetmind.ai", 1462.0, 1540.0, "Absolutely. I'll send calendar invites for next Thursday — does that work for your team? I'll also prepare a custom onboarding guide with Acme Corp branding. Let me confirm our timeline: credentials out by Monday, training webinar Thursday, and you're live by Friday.", 17),
            (uid(), t3_id, "Tom Nguyen", "tom@acmecorp.com", 1542.0, 1600.0, "Thursday works. I'll make sure all 15 leaders block their calendars. This has been a really helpful call, Alex. We're excited to get started.", 18),
        ]

        for seg_data in m3_segs:
            seg = TranscriptSegment(id=seg_data[0], transcript_id=seg_data[1], speaker_name=seg_data[2], speaker_email=seg_data[3], start_time=seg_data[4], end_time=seg_data[5], text=seg_data[6], segment_index=seg_data[7])
            db.add(seg)
        await db.flush()

        s3 = Summary(
            id=uid(), meeting_id=m3_id,
            overview="Successful client onboarding call with Acme Corp covering platform capabilities, integration requirements, security compliance, and rollout planning. Sarah Mitchell and Tom Nguyen from Acme Corp have 200 meetings/week and are primarily concerned with action item tracking and reducing post-meeting friction. The team agreed on a phased rollout starting with 15 leadership team members in a 30-day success sprint. Key integrations required are Google Meet (available now), Slack (available now), with Salesforce and Jira on the Q4 roadmap.",
            key_points=[
                "Acme Corp runs 200 meetings/week — main pain point is lost action items and manual tracking friction",
                "Google Meet and Slack integrations confirmed available; Salesforce and Jira promised for Q4",
                "Security requirements confirmed: AES-256 encryption, SOC 2 Type II, GDPR compliance",
                "30-day success sprint agreed with 15-person leadership team pilot",
                "Key success metrics: action item completion rate, meeting time saved, search usage",
            ],
            chapters=[
                {"title": "Requirements Discovery", "start_seconds": 0, "summary": "Acme Corp shared context: 200 meetings/week, action item tracking as primary pain point, need for low-friction solution."},
                {"title": "Integration & Security Deep-Dive", "start_seconds": 482, "summary": "Google Meet, Slack, Salesforce integration requirements discussed. Security and privacy requirements addressed."},
                {"title": "Rollout Planning", "start_seconds": 1022, "summary": "Phased rollout agreed: 15-person leadership pilot, 30-day success sprint with bi-weekly check-ins."},
                {"title": "Next Steps & Timeline", "start_seconds": 1382, "summary": "Credentials by Monday, training webinar Thursday, live by Friday next week."},
            ],
            sentiment="positive",
        )
        db.add(s3)

        ai3_items = [
            ActionItem(id=uid(), meeting_id=m3_id, text="Send security whitepaper and compliance documentation to Tom", assignee="Alex Chen", due_date=date.today() - timedelta(days=5), priority="high", status="done"),
            ActionItem(id=uid(), meeting_id=m3_id, text="Provision 15 user accounts for Acme Corp leadership team by Monday", assignee="Alex Chen", due_date=date.today() - timedelta(days=4), priority="high", status="done"),
            ActionItem(id=uid(), meeting_id=m3_id, text="Prepare custom onboarding guide with Acme Corp branding", assignee="Alex Chen", due_date=date.today() - timedelta(days=3), priority="medium", status="pending"),
            ActionItem(id=uid(), meeting_id=m3_id, text="Schedule and host 45-minute training webinar for 15 Acme leaders", assignee="Alex Chen", due_date=date.today() + timedelta(days=3), priority="high", status="pending"),
            ActionItem(id=uid(), meeting_id=m3_id, text="Set up ROI tracking dashboard with Acme Corp metrics", assignee="Alex Chen", due_date=date.today() + timedelta(days=7), priority="medium", status="pending"),
        ]
        for ai in ai3_items:
            db.add(ai)

        db.add(MeetingTag(meeting_id=m3_id, tag_id=tag_client.id))
        await db.flush()

        # ════════════════════════════════════════════════════════════════════
        # MEETING 4: Design Review — New Dashboard
        # ════════════════════════════════════════════════════════════════════
        m4_id = uid()
        m4 = Meeting(
            id=m4_id, user_id=DEFAULT_USER_ID,
            title="Design Review — New Dashboard",
            date=days_ago(5), duration_secs=2040,
            status="processed",
            participants=["Alex Chen", "Priya Sharma", "Lena Kovacs"],
        )
        db.add(m4)
        await db.flush()

        t4_id = uid()
        t4 = Transcript(id=t4_id, meeting_id=m4_id, raw_text="Design review transcript", word_count=2100)
        db.add(t4)
        await db.flush()

        m4_segs = [
            (uid(), t4_id, "Priya Sharma", "priya@meetmind.ai", 0.0, 60.0, "Okay let's get into it. I'm going to walk you through the new dashboard designs. I'm sharing my screen now — you should be able to see the Figma file. Let's start with the overview screen.", 0),
            (uid(), t4_id, "Alex Chen", "alex@meetmind.ai", 62.0, 120.0, "Love the overall direction. The stats cards at the top are really clean. I notice you're using a lighter shade for the metric values — is that intentional or a contrast issue?", 1),
            (uid(), t4_id, "Priya Sharma", "priya@meetmind.ai", 122.0, 200.0, "That was intentional to create visual hierarchy — the label is lighter, the number is bolder. But now that you're pointing it out, the contrast ratio on the label might not meet WCAG AA. Let me check the hex values.", 2),
            (uid(), t4_id, "Lena Kovacs", "lena@meetmind.ai", 202.0, 290.0, "That's actually something I flagged in my feedback notes. The muted text at opacity 0.6 on the dark background doesn't pass WCAG AA. We need a minimum contrast ratio of 4.5:1 for normal text. I ran it through the checker — we're at 3.2:1.", 3),
            (uid(), t4_id, "Priya Sharma", "priya@meetmind.ai", 292.0, 360.0, "Good catch, Lena. I'll adjust the opacity to at least 0.75 or shift the color value to meet the requirement. I'll recheck all muted text across the system while I'm at it.", 4),
            (uid(), t4_id, "Alex Chen", "alex@meetmind.ai", 362.0, 440.0, "The meeting cards look great. I love the participant avatar stack and the tag chips. One question — on mobile, how do these cards reflow? You have a three-column stats row that I imagine collapses to single column?", 5),
            (uid(), t4_id, "Priya Sharma", "priya@meetmind.ai", 442.0, 520.0, "Yes, exactly. Stats go single column, meeting cards go full width. Let me flip to the mobile frames — here. The sidebar collapses to a bottom tab bar on mobile. I think the overall hierarchy holds up pretty well.", 6),
            (uid(), t4_id, "Lena Kovacs", "lena@meetmind.ai", 522.0, 610.0, "The mobile layout is solid but I want to flag that the bottom tab bar only has four items and we have five nav items. We'll need to either combine some items or use a More menu. Also the icon sizes in the tab bar look a bit small at 20px — industry standard is 24px minimum.", 7),
            (uid(), t4_id, "Priya Sharma", "priya@meetmind.ai", 612.0, 680.0, "I can bump the tab bar icons to 24px and combine Settings into a profile icon that opens a sheet. That should solve both issues. Let me note that.", 8),
            (uid(), t4_id, "Alex Chen", "alex@meetmind.ai", 682.0, 760.0, "Let's talk about the color system. I know we've been going back and forth on whether to support both dark and light mode. My vote is still dark mode as default with light mode toggle. Priya, are both modes designed?", 9),
            (uid(), t4_id, "Priya Sharma", "priya@meetmind.ai", 762.0, 840.0, "Dark mode is 90% done. Light mode is at 60% — I did the main screens but some of the component states aren't done yet. I'd recommend we ship dark mode first and add light mode in the next sprint. It's better to ship one polished mode than two half-baked ones.", 10),
            (uid(), t4_id, "Lena Kovacs", "lena@meetmind.ai", 842.0, 920.0, "Agreed on shipping dark mode first. One thing I want to make sure we get right before ship is the focus states for keyboard navigation. I didn't see focus rings in the Figma — were those omitted from the design or from the dev implementation?", 11),
            (uid(), t4_id, "Priya Sharma", "priya@meetmind.ai", 922.0, 1000.0, "Omitted from the Figma designs — I was focused on the visual states. Let me add focus states to the component library this week. They should follow the primary color with a 2px offset ring.", 12),
            (uid(), t4_id, "Alex Chen", "alex@meetmind.ai", 1002.0, 1080.0, "Good. Also the component library — Marcus mentioned we're missing a few components that came up during implementation. Specifically, date range picker, multi-select dropdown, and a timeline component. Are those on your backlog?", 13),
            (uid(), t4_id, "Priya Sharma", "priya@meetmind.ai", 1082.0, 1150.0, "They are, but they're lower priority in my current queue. Given the engineering blockers, I can pull them forward. I'll aim to have those three components designed by end of sprint.", 14),
            (uid(), t4_id, "Lena Kovacs", "lena@meetmind.ai", 1152.0, 1230.0, "One last thing from me — the empty states. They're illustrated which is great, but the illustrations feel a bit off-brand. The colors are more playful than our overall aesthetic. Can we align them to the primary palette?", 15),
            (uid(), t4_id, "Priya Sharma", "priya@meetmind.ai", 1232.0, 1290.0, "You're right, those were placeholder illustrations. I'll redo them in the MeetMind violet and cyan palette. Should be a quick pass — maybe 30 minutes total for all six states.", 16),
            (uid(), t4_id, "Alex Chen", "alex@meetmind.ai", 1292.0, 1360.0, "Perfect. Great review everyone. Let's recap the action items: Priya fixes contrast ratios and focus states, redo empty state illustrations, and designs the three missing components. We target dark mode launch next sprint. Thanks Lena for the accessibility deep dive — that kind of detail matters.", 17),
        ]

        for seg_data in m4_segs:
            seg = TranscriptSegment(id=seg_data[0], transcript_id=seg_data[1], speaker_name=seg_data[2], speaker_email=seg_data[3], start_time=seg_data[4], end_time=seg_data[5], text=seg_data[6], segment_index=seg_data[7])
            db.add(seg)
        await db.flush()

        s4 = Summary(
            id=uid(), meeting_id=m4_id,
            overview="Design review of the new MeetMind dashboard with focus on the meeting list view, mobile responsiveness, accessibility, and component library gaps. Lena identified critical contrast ratio issues with muted text not meeting WCAG AA standards. The team agreed to launch dark mode first before adding light mode. Focus states for keyboard navigation were missing from the Figma designs and will be added. Three component library gaps were identified that need to be filled before engineering can continue.",
            key_points=[
                "Muted text contrast ratio at 3.2:1 — needs adjustment to meet WCAG AA 4.5:1 minimum",
                "Dark mode to launch first next sprint; light mode to follow in subsequent sprint",
                "Focus states for keyboard navigation missing from component library — to be added",
                "Mobile bottom tab bar needs: icons bumped to 24px, fifth item handled via profile sheet",
                "Three missing components needed: date range picker, multi-select dropdown, timeline",
                "Empty state illustrations need rebrand to MeetMind violet/cyan palette",
            ],
            chapters=[
                {"title": "Dashboard Overview Review", "start_seconds": 0, "summary": "Walkthrough of main dashboard design. Stats cards and meeting list reviewed with accessibility flags raised."},
                {"title": "Mobile Layout & Navigation", "start_seconds": 362, "summary": "Mobile responsiveness reviewed. Bottom tab bar issues identified and solutions proposed."},
                {"title": "Color System & Accessibility", "start_seconds": 682, "summary": "Dark/light mode strategy finalized. Keyboard focus states and WCAG compliance gaps addressed."},
            ],
            sentiment="positive",
        )
        db.add(s4)

        ai4_items = [
            ActionItem(id=uid(), meeting_id=m4_id, text="Fix muted text contrast ratios across all screens to meet WCAG AA 4.5:1", assignee="Priya Sharma", due_date=date.today() + timedelta(days=3), priority="high", status="pending"),
            ActionItem(id=uid(), meeting_id=m4_id, text="Add keyboard focus states (2px primary color ring) to all interactive components", assignee="Priya Sharma", due_date=date.today() + timedelta(days=5), priority="high", status="pending"),
            ActionItem(id=uid(), meeting_id=m4_id, text="Design 3 missing components: date range picker, multi-select dropdown, timeline", assignee="Priya Sharma", due_date=date.today() + timedelta(days=10), priority="medium", status="pending"),
        ]
        for ai in ai4_items:
            db.add(ai)

        db.add(MeetingTag(meeting_id=m4_id, tag_id=tag_design.id))
        db.add(MeetingTag(meeting_id=m4_id, tag_id=tag_product.id))
        await db.flush()

        # ════════════════════════════════════════════════════════════════════
        # MEETING 5: Investor Update — Series A Prep
        # ════════════════════════════════════════════════════════════════════
        m5_id = uid()
        m5 = Meeting(
            id=m5_id, user_id=DEFAULT_USER_ID,
            title="Investor Update — Series A Prep",
            date=weeks_ago(2), duration_secs=3300,
            status="processed",
            participants=["Alex Chen", "Jordan Williams", "Rachel Kim"],
        )
        db.add(m5)
        await db.flush()

        t5_id = uid()
        t5 = Transcript(id=t5_id, meeting_id=m5_id, raw_text="Investor update transcript", word_count=3800)
        db.add(t5)
        await db.flush()

        m5_segs = [
            (uid(), t5_id, "Alex Chen", "alex@meetmind.ai", 0.0, 60.0, "Rachel, thanks for making time today. We wanted to give you an early look at where we are heading into the Series A. Jordan's going to walk through the metrics, and then we can get into product differentiation and the competitive landscape.", 0),
            (uid(), t5_id, "Rachel Kim", "rachel@sequoia.com", 62.0, 140.0, "Happy to be here. I've been tracking you all since the seed round and I'm excited to see the progress. Let's start with the numbers — what does the growth curve look like?", 1),
            (uid(), t5_id, "Jordan Williams", "jordan@meetmind.ai", 142.0, 240.0, "We're at 2,400 active teams this month, up from 800 three months ago — that's 3x growth. MRR is at $58K, growing about 18% month-over-month. Our best cohort, the enterprise tier, has 96% retention at 90 days. The numbers are strong but I want to be honest — we're not yet at the scale that makes a Series A obvious.", 2),
            (uid(), t5_id, "Rachel Kim", "rachel@sequoia.com", 242.0, 330.0, "I appreciate the candor. 18% MoM on MRR is actually quite solid for a B2B SaaS at your stage. What's driving churn in the segments that aren't retaining? What does the bottom cohort look like?", 3),
            (uid(), t5_id, "Jordan Williams", "jordan@meetmind.ai", 332.0, 420.0, "Bottom cohort is small teams, under 10 people, on our free tier. The churn there is high — about 40% at 30 days — mostly because they don't upload enough meetings to see the value. Our activation metric is three meetings in the first week. Teams that hit that threshold retain at over 85%.", 4),
            (uid(), t5_id, "Alex Chen", "alex@meetmind.ai", 422.0, 510.0, "We've been working on an onboarding flow redesign specifically to drive that activation metric. Early results from the new onboarding are promising — we've gone from 31% hitting the three-meeting threshold in week one to 47% in our beta cohort.", 5),
            (uid(), t5_id, "Rachel Kim", "rachel@sequoia.com", 512.0, 600.0, "That's a meaningful lift. If you can sustain that, it changes the free-to-paid conversion math significantly. What's the burn rate? And runway at current burn?", 6),
            (uid(), t5_id, "Alex Chen", "alex@meetmind.ai", 602.0, 690.0, "Monthly burn is $180K, runway is 14 months at current burn. We've been pretty disciplined — team is nine people, five of whom are engineers. We expect burn to increase as we hire for the Series A, but we're not feeling pressure to raise immediately.", 7),
            (uid(), t5_id, "Rachel Kim", "rachel@sequoia.com", 692.0, 780.0, "14 months is healthy. Let me ask about the competitive landscape. Otter.ai, Fireflies, Fathom, Grain — you have well-funded competitors. What's your wedge? Why does MeetMind win?", 8),
            (uid(), t5_id, "Jordan Williams", "jordan@meetmind.ai", 782.0, 880.0, "Our differentiation is in the action intelligence layer. Competitors stop at transcription and basic summaries. We go deeper — structured action items, progress tracking, cross-meeting search, and we're building team-level analytics that surface patterns across all meetings. It's the difference between a recorder and an intelligence platform.", 9),
            (uid(), t5_id, "Alex Chen", "alex@meetmind.ai", 882.0, 970.0, "And the AI quality matters a lot here. We've invested heavily in our prompting and post-processing pipeline. Our action item extraction accuracy is at 91% precision in user testing, compared to about 73% for the best competitor we've tested. That gap is defensible because it's not just the model — it's the product design around the AI.", 10),
            (uid(), t5_id, "Rachel Kim", "rachel@sequoia.com", 972.0, 1060.0, "That precision metric is interesting. How are you measuring it? Is that user-validated or automated? I want to understand if that's a durable advantage or something that converges over time as models improve.", 11),
            (uid(), t5_id, "Alex Chen", "alex@meetmind.ai", 1062.0, 1150.0, "User-validated — we have 50 beta users who manually review action items and rate them. It's a real signal. The durability question is fair though. Our bet is that model quality converges but UX and workflow integration are where we build the moat. The AI gets you in the door but the product keeps you.", 12),
            (uid(), t5_id, "Jordan Williams", "jordan@meetmind.ai", 1152.0, 1240.0, "We're also building proprietary training data. Every correction a user makes to an AI-generated action item feeds back into our fine-tuning pipeline. By the time we have 10,000 teams, we'll have a dataset that's very hard to replicate.", 13),
            (uid(), t5_id, "Rachel Kim", "rachel@sequoia.com", 1242.0, 1330.0, "That's a good long-term strategy. What would you do with a $5M Series A? What does the 18-month plan look like?", 14),
            (uid(), t5_id, "Alex Chen", "alex@meetmind.ai", 1332.0, 1430.0, "Four priorities: first, grow the team to 18 people with emphasis on AI engineering and enterprise sales. Second, build the integration layer — Salesforce, HubSpot, Jira — that unlocks enterprise deals. Third, launch team analytics which is the feature most requested by our enterprise customers. Fourth, expand internationally — we're seeing strong inbound from Europe and APAC.", 15),
            (uid(), t5_id, "Rachel Kim", "rachel@sequoia.com", 1432.0, 1520.0, "The enterprise sales motion concerns me a little. Enterprise sales cycles are long and expensive. Have you validated that your ACV supports that motion? What's your current ACV for enterprise accounts?", 16),
            (uid(), t5_id, "Jordan Williams", "jordan@meetmind.ai", 1522.0, 1610.0, "Enterprise ACV is currently around $8,400 annually for teams of 50-100 people. We think there's headroom to $15K-20K once we add the advanced analytics and integration features. At $15K ACV, a 12-month sales cycle can be justified with a small sales team. We're being realistic about the timeline.", 17),
            (uid(), t5_id, "Alex Chen", "alex@meetmind.ai", 1612.0, 1680.0, "Rachel, we'd love to stay in touch as we finalize the round. We're not in a rush — we want the right partner, not just capital. Would a follow-up call in six weeks make sense? We'll have the new onboarding cohort data by then.", 18),
        ]

        for seg_data in m5_segs:
            seg = TranscriptSegment(id=seg_data[0], transcript_id=seg_data[1], speaker_name=seg_data[2], speaker_email=seg_data[3], start_time=seg_data[4], end_time=seg_data[5], text=seg_data[6], segment_index=seg_data[7])
            db.add(seg)
        await db.flush()

        s5 = Summary(
            id=uid(), meeting_id=m5_id,
            overview="Series A preparation meeting with Rachel Kim from Sequoia Capital covering MeetMind's growth metrics, burn rate, competitive positioning, and fundraising plans. The team presented strong MoM growth (18%) and enterprise retention (96%), while being transparent about free-tier churn challenges. Rachel asked probing questions about competitive differentiation, AI advantage durability, and enterprise sales motion economics. The meeting concluded with agreement on a six-week follow-up once new onboarding cohort data is available.",
            key_points=[
                "MRR at $58K, 18% MoM growth, 2,400 active teams (3x growth in 3 months)",
                "Enterprise cohort retention at 96% at 90 days — key strength",
                "Free-tier churn at 40% at 30 days driven by low activation; new onboarding improved week-1 activation from 31% to 47%",
                "Monthly burn $180K, 14 months runway — not in pressure to raise immediately",
                "Competitive differentiation: action intelligence layer, 91% precision vs 73% competitor, proprietary training data flywheel",
                "Series A target: $5M for team growth to 18, integrations, team analytics, international expansion",
            ],
            chapters=[
                {"title": "Growth Metrics Review", "start_seconds": 0, "summary": "Jordan presented MRR, user growth, and cohort retention data. Rachel probed churn drivers and activation metrics."},
                {"title": "Financials & Runway", "start_seconds": 512, "summary": "Burn rate and runway discussed. 14 months of runway confirmed with disciplined 9-person team."},
                {"title": "Competitive Landscape", "start_seconds": 692, "summary": "MeetMind's differentiation via action intelligence layer and AI precision metrics presented and challenged by Rachel."},
                {"title": "Series A Plan", "start_seconds": 1242, "summary": "$5M use of funds outlined: team, integrations, analytics, international. Enterprise ACV economics discussed."},
            ],
            sentiment="mixed",
        )
        db.add(s5)

        ai5_items = [
            ActionItem(id=uid(), meeting_id=m5_id, text="Prepare 30-day onboarding cohort data report showing activation rate improvement", assignee="Jordan Williams", due_date=date.today() + timedelta(days=14), priority="high", status="pending"),
            ActionItem(id=uid(), meeting_id=m5_id, text="Draft Series A use-of-funds deck with team hiring plan and 18-month roadmap", assignee="Alex Chen", due_date=date.today() + timedelta(days=21), priority="high", status="pending"),
            ActionItem(id=uid(), meeting_id=m5_id, text="Schedule follow-up call with Rachel Kim in 6 weeks with updated metrics", assignee="Alex Chen", due_date=date.today() + timedelta(days=7), priority="medium", status="pending"),
            ActionItem(id=uid(), meeting_id=m5_id, text="Document AI action item precision methodology for investor due diligence", assignee="Jordan Williams", due_date=date.today() + timedelta(days=10), priority="medium", status="pending"),
        ]
        for ai in ai5_items:
            db.add(ai)

        db.add(MeetingTag(meeting_id=m5_id, tag_id=tag_product.id))
        await db.flush()

        # ════════════════════════════════════════════════════════════════════
        # MEETING 6: Bug Bash & Retrospective
        # ════════════════════════════════════════════════════════════════════
        m6_id = uid()
        m6 = Meeting(
            id=m6_id, user_id=DEFAULT_USER_ID,
            title="Bug Bash & Sprint Retrospective",
            date=weeks_ago(3), duration_secs=2460,
            status="processed",
            participants=["Alex Chen", "Diego Reyes", "Yuki Tanaka", "Marcus Lee"],
        )
        db.add(m6)
        await db.flush()

        t6_id = uid()
        t6 = Transcript(id=t6_id, meeting_id=m6_id, raw_text="Bug bash retro transcript", word_count=2800)
        db.add(t6)
        await db.flush()

        m6_segs = [
            (uid(), t6_id, "Alex Chen", "alex@meetmind.ai", 0.0, 50.0, "Alright team, bug bash time. We've got 23 bugs in the tracker from the sprint. Let's triage them by priority and assign owners. Then we'll do a retro. Diego, can you share your screen so we can go through the Jira board together?", 0),
            (uid(), t6_id, "Diego Reyes", "diego@meetmind.ai", 52.0, 130.0, "Sure, sharing now. So I've pre-sorted them into three buckets: critical — two bugs that cause data loss or crashes. High — eight bugs that break key user flows but have workarounds. And medium/low — the rest.", 1),
            (uid(), t5_id, "Marcus Lee", "marcus@meetmind.ai", 132.0, 210.0, "The two critical ones — I know what they are. The race condition in the transcript save flow and the auth token refresh bug. I've actually already got a fix for the transcript save issue — it's in review. The auth bug I haven't dug into yet.", 2),
            (uid(), t6_id, "Yuki Tanaka", "yuki@meetmind.ai", 212.0, 290.0, "I can take the auth token refresh bug. I was in that code last week for the session handling work so I know the area pretty well. How critical is the timeline on that one?", 3),
            (uid(), t6_id, "Alex Chen", "alex@meetmind.ai", 292.0, 370.0, "It's causing about 8% of users to get unexpectedly logged out on mobile. That's unacceptable — I'd like it patched this week. Yuki, please make it your top priority after standup today.", 4),
            (uid(), t6_id, "Diego Reyes", "diego@meetmind.ai", 372.0, 450.0, "Moving on to the high-priority bugs — the one I want to flag specifically is the search results not updating when filters change. A few customers have complained about this on Twitter and it's making us look bad.", 5),
            (uid(), t6_id, "Marcus Lee", "marcus@meetmind.ai", 452.0, 530.0, "That one's probably a React state issue. The filter state is updating but the results component isn't re-rendering. I can fix that in an hour, it's a quick one.", 6),
            (uid(), t6_id, "Yuki Tanaka", "yuki@meetmind.ai", 532.0, 610.0, "There's also the transcript segment highlighting bug — when you search within a transcript, sometimes the wrong segments get highlighted. It's an off-by-one error in the match index calculation. I have a fix drafted, just needs testing.", 7),
            (uid(), t6_id, "Alex Chen", "alex@meetmind.ai", 612.0, 690.0, "Great, let's make sure all the high-priority ones are assigned and have owners before we move on. Diego, can you do a final pass on the bug board after this and make sure everything is assigned and has an estimated fix date?", 8),
            (uid(), t6_id, "Diego Reyes", "diego@meetmind.ai", 692.0, 760.0, "Will do. I'll update the board by EOD and send a summary to the team channel.", 9),
            (uid(), t6_id, "Alex Chen", "alex@meetmind.ai", 762.0, 840.0, "Okay, let's shift to the retro. I want to do a quick what went well, what didn't, and what we change. I'll start — what went well for me was the team communication this sprint. We had no surprises in the last 48 hours which is unusual and appreciated.", 10),
            (uid(), t6_id, "Marcus Lee", "marcus@meetmind.ai", 842.0, 920.0, "What went well for me: the PR review turnaround. We had a two-day average review time which is much better than the week-long waits we had before. That process change is working. What didn't go well: scope creep. We added four stories mid-sprint that weren't in the original plan.", 11),
            (uid(), t6_id, "Yuki Tanaka", "yuki@meetmind.ai", 922.0, 1000.0, "Agree on scope creep — it's a consistent problem. I had two stories get added mid-sprint that I wasn't prepared for and it broke my focus. I'd like to propose a freeze on new stories after the sprint starts unless they're critical bugs.", 12),
            (uid(), t6_id, "Diego Reyes", "diego@meetmind.ai", 1002.0, 1080.0, "Strong plus one on that. What didn't go well for me was test coverage. We shipped some features without enough test coverage and that's why we ended up with some of these bugs. I want us to add a definition of done that requires at least 80% test coverage on new code.", 13),
            (uid(), t6_id, "Alex Chen", "alex@meetmind.ai", 1082.0, 1160.0, "Both of those are actionable. Sprint freeze after day two except for critical bugs — I'll enforce that from my side too. And the 80% test coverage DoD — Marcus, can you add that to our team norms doc and our PR template? Let's make it official.", 14),
            (uid(), t6_id, "Marcus Lee", "marcus@meetmind.ai", 1162.0, 1240.0, "On it. I'll update the PR template today and send the updated team norms for review. One more process idea — daily async standups in Slack instead of a synchronous call on Fridays. Fridays are our lowest energy day and the call often feels like a drag.", 15),
            (uid(), t6_id, "Alex Chen", "alex@meetmind.ai", 1242.0, 1320.0, "I like the idea but let's trial it for two sprints before fully committing. We still need some real-time sync — maybe we keep a Friday sync but make it 15 minutes max and async Slack for the other four days?", 16),
            (uid(), t6_id, "Yuki Tanaka", "yuki@meetmind.ai", 1322.0, 1380.0, "That sounds like a good compromise. Can we also agree to end meetings when they reach the time box? We keep going 10-15 minutes over and it's affecting my afternoon schedule.", 17),
            (uid(), t6_id, "Alex Chen", "alex@meetmind.ai", 1382.0, 1440.0, "Fair point and I'm probably the main offender there. I'll set a hard timer. Wrapping up — great retro everyone. We have clear action items, bug owners are all assigned. See you all at standup tomorrow.", 18),
        ]

        for seg_data in m6_segs:
            if seg_data[1] == t5_id:  # Fix the wrong transcript_id
                seg = TranscriptSegment(id=seg_data[0], transcript_id=t6_id, speaker_name=seg_data[2], speaker_email=seg_data[3], start_time=seg_data[4], end_time=seg_data[5], text=seg_data[6], segment_index=seg_data[7])
            else:
                seg = TranscriptSegment(id=seg_data[0], transcript_id=seg_data[1], speaker_name=seg_data[2], speaker_email=seg_data[3], start_time=seg_data[4], end_time=seg_data[5], text=seg_data[6], segment_index=seg_data[7])
            db.add(seg)
        await db.flush()

        s6 = Summary(
            id=uid(), meeting_id=m6_id,
            overview="Sprint bug bash and retrospective session covering bug triage, prioritization, and process improvement discussions. Two critical bugs were identified and assigned immediately. The retro surfaced two consistent pain points: mid-sprint scope creep and insufficient test coverage. The team agreed to institute a sprint freeze policy after day two, add an 80% test coverage definition of done, and trial async daily standups on Slack with a shortened Friday sync.",
            key_points=[
                "Two critical bugs assigned: transcript save race condition (Marcus) and auth token refresh (Yuki)",
                "Eight high-priority bugs triaged and assigned with EOD deadline for owner confirmation",
                "Sprint freeze policy agreed: no new stories after day two except critical bugs",
                "80% test coverage to be added to PR template and definition of done",
                "Async daily standups in Slack plus 15-minute Friday sync to be trialed for two sprints",
                "PR review turnaround improved to 2-day average — process change working well",
            ],
            chapters=[
                {"title": "Bug Triage & Assignment", "start_seconds": 0, "summary": "23 bugs triaged across critical, high, and medium priority. Owners assigned for all critical and high-priority items."},
                {"title": "Sprint Retrospective", "start_seconds": 762, "summary": "What went well: communication and PR review speed. What didn't: scope creep and test coverage gaps."},
                {"title": "Process Improvements", "start_seconds": 1082, "summary": "Three process changes agreed: sprint freeze policy, 80% test coverage DoD, and async standup trial."},
            ],
            sentiment="neutral",
        )
        db.add(s6)

        ai6_items = [
            ActionItem(id=uid(), meeting_id=m6_id, text="Update PR template and team norms doc to include 80% test coverage requirement", assignee="Marcus Lee", due_date=date.today() - timedelta(days=14), priority="high", status="done"),
            ActionItem(id=uid(), meeting_id=m6_id, text="Fix auth token refresh bug causing 8% of mobile users to be logged out", assignee="Yuki Tanaka", due_date=date.today() - timedelta(days=16), priority="high", status="done"),
            ActionItem(id=uid(), meeting_id=m6_id, text="Update Jira bug board with owners and estimated fix dates for all 23 bugs", assignee="Diego Reyes", due_date=date.today() - timedelta(days=20), priority="medium", status="done"),
        ]
        for ai in ai6_items:
            db.add(ai)

        db.add(MeetingTag(meeting_id=m6_id, tag_id=tag_engineering.id))
        await db.flush()

        # ════════════════════════════════════════════════════════════════════
        # HIGHLIGHTS (1 per meeting)
        # ════════════════════════════════════════════════════════════════════
        # Fetch segment IDs to attach highlights
        from sqlalchemy import select as sa_select

        async def get_first_seg(transcript_id: str, index: int):
            res = await db.execute(
                sa_select(TranscriptSegment.id).where(
                    TranscriptSegment.transcript_id == transcript_id,
                    TranscriptSegment.segment_index == index
                )
            )
            return res.scalar_one_or_none()

        h1_seg = await get_first_seg(t1_id, 9)  # "top three requests"
        h2_seg = await get_first_seg(t2_id, 9)  # "Thursday deploy target"
        h3_seg = await get_first_seg(t3_id, 14) # "three metrics we track"
        h4_seg = await get_first_seg(t4_id, 3)  # "contrast ratio" issue
        h5_seg = await get_first_seg(t5_id, 9)  # "action intelligence layer"
        h6_seg = await get_first_seg(t6_id, 12) # "scope creep" comment

        highlights_data = [
            (m1_id, h1_seg, "Key customer priorities for Q4 planning", "yellow"),
            (m2_id, h2_seg, "Thursday deploy commitment — track carefully", "green"),
            (m3_id, h3_seg, "Core success metrics for Acme Corp ROI presentation", "blue"),
            (m4_id, h4_seg, "Critical accessibility fix required before ship", "pink"),
            (m5_id, h5_seg, "Core competitive differentiation statement for investor deck", "yellow"),
            (m6_id, h6_seg, "Process improvement proposal — scope freeze policy", "green"),
        ]

        for m_id, seg_id, note, color in highlights_data:
            if seg_id:
                db.add(Highlight(id=uid(), segment_id=seg_id, meeting_id=m_id, note=note, color=color))

        await db.commit()
        print("✅ Database seeded successfully!")
        print(f"   - 1 user created")
        print(f"   - 4 tags created")
        print(f"   - 6 meetings with transcripts, summaries, action items, and highlights")


if __name__ == "__main__":
    asyncio.run(seed())
