# The vision, the fields, and the sectors

*Written 2026-09-07, rewritten 2026-09-09 after three sealed lanes attacked it. Part one is the
ambition. Part two is the field map — 53 domains in plain questions, in nobody's vocabulary but the ordinary
one. Re-derive rather than trust those figures: `grep -c '^### [0-9]' <this file>` counts the fields
plus part three's three subsections, and
`awk '/^## Part two/,/^## Part three/' <this file> | grep -o '?' | wc -l` counts the questions. Part three is the sectors: where such a thing may operate, and what it touches whether it
means to or not.*

*Two earlier versions were rejected for being written inside the frame of a design already chosen. This
one was produced differently: three lanes reasoned about the ambition without reading the plan, one of
them tasked with attacking it and given the means to check things in the world. Their files are in
`vision/`. **Where they disagreed, this text says so rather than picking a winner.***

---

## Part one · The vision

**One person is responsible for work they did not watch.** That is the ambition, stated as precisely as
it can be. Not a company that runs itself — that phrasing describes an absence and hides the difficulty.
The difficulty is that responsibility does not delegate. Someone still has to be answerable for what was
built, said, sold and promised in their name, and the whole question is what would have to be true for a
single person to accept that honestly, at a scale no single person could personally inspect.

**What is really being bought is not effort and not speed. It is that one person's judgement stops
being capped by the size of the organisation needed to carry it.** Every layer of a real organisation
loses a little of what was meant — not through incompetence, but because intent is re-described at each
handover until the thing that gets built is a cousin of the thing that was wanted. **The ambition is not
the removal of people. It is the removal of that loss.** What one person actually decides, and what
finally reaches a customer, should be the same thing.

**The thing that has to be built is the account, not the work.** Producing — code, copy, analysis,
outreach — is being commoditised quickly by people with far more resources, and anything built on top of
that is rented. **What nobody sells, and what no vendor will build, is a truthful account of work you
did not watch.** Not a log of what happened: an account whose value lives in its negative space — what
was skipped, what is stale, what was assumed, what it could not determine, and what it chose not to tell
you and why. No vendor will build that, because such an account has to be adversarial toward whoever
produced the work, and they are the producer. **That is the durable position, and it is the only part of
this worth years of a life.**

**The honest form of "one person does what a company used to" is not output. It is the cost of being
wrong.** A company with staff must be roughly right, because being wrong costs salaries and months. A
person with this can be wrong most of the time on purpose — if starting is cheap and, more importantly,
if **killing is cheap and fast.** The measure of success is therefore not how much was produced. It is
how many real attempts reached real strangers, and how quickly the failures were buried. **Most ideas die
today not because they were bad but because the cost of finding out was too high, which filters on
accounting rather than on merit.** Removing that filter is the whole prize.

**Permission has to follow consequence, never track record.** This is the correction that cost the
earlier drafts the most. It is tempting to say the system earns freedom by being right repeatedly — but a
track record only estimates a frequency, and the acts that can ruin you are not drawn from the bag it was
graded on. **Freedom would then be widest exactly when nobody had looked recently.** So what may be done
unsupervised is decided by what the act can cost: money leaving, words reaching strangers, anything
irreversible, anything touching another person's data. **A good record should change how much you check.
It must never change what you are exposed to.**

**It has to keep the owner competent, not merely informed — and that means sometimes handing back work it
could have done.** Judgement is not stored; it is trained, and it decays without contact. Someone who has
not read a customer's own words in eight months is applying a year-old picture and feels exactly as
confident as before. The loop keeps running, every part of it looks healthy, and the input has quietly
gone stale. **There is no signal for this from inside, because the owner is the instrument and the
instrument is what drifted.** So the design has to spend the owner's time deliberately, on work it could
have handled, and it needs a mechanism rather than good intentions.

**Attention is the only genuinely fixed input, and success consumes it fastest.** Reading can be
compressed; deciding cannot. So when the owner's capacity is reached, the system must **decline work**
rather than ask for more of them. The alternative is that success ends in rubber-stamping — which is
indistinguishable, from the outside and in the record, from real approval.

**What this costs should be said plainly, because a vision with no cost is a advertisement.**
Accountability concentrates rather than evaporates: an organisation is partly a device for spreading
blame, and with the people removed, one name carries all of it — including for outputs nobody ever read.
Escalation concentrates unpleasantness too: the system keeps every decision that has a clean answer and
hands up the residue, so the owner receives the worst-tasting slice of their own job, daily, forever, and
stripped of the context that used to make such calls easy. And the owner becomes a person who specifies
and judges rather than one who builds — **which is a different life, and worth wanting on purpose rather
than arriving at by accident.**

**A short list cannot be delegated, and the value of everything above depends on drawing it tightly.**
Wanting something. Being answerable, which requires something that can actually lose. Standing behind a
promise, because that is the other party's call and can never be settled unilaterally. Relationships
where being a person is the point. Taste, as a fixed standard rather than a drifting one. Deciding what
is worth *wanting*, as opposed to what is worth doing. And one that is engineering rather than a fact
about persons — **the system's own truthfulness, which is why it is the binding constraint on all the
rest.**

**How this would be known to have failed.** If the time spent checking grows with the work produced, it
has failed however good the work is, because the owner has become a reviewer working the same hours. If
in five years there is an excellent machine and nothing it made was worth more than it cost to make it,
it has failed — and that is the likeliest failure, because **the work gets more interesting the further
it gets from a customer.** And if the owner can no longer explain their own business, it has failed even
while every number looks good.

---

## Part two · The field map

**How to read this.** Each numbered field is a domain the system has to take a position on. Under it are
plain questions. **Fields 1–32 are company-shaped and would be asked of any organisation. Fields 33–48
are the machinery of a system built out of models and agents, and 49–53 are the ones an old checklist of the founder's surfaced that neither reached** — instructions, skills, connections, tool
use, workflows, stages, delegation, judging behaviour, testing, seeing inside a run, guardrails,
grounding, what passes between steps, where a person sits, self-modification, and reproducibility. Those
sixteen have their own fields rather than living inside an abstraction, because **a subject with no field
of its own gets thought about only when it breaks.**

Under each field are plain questions — the things anyone building a company that mostly runs itself would eventually have to
answer, whether or not they had ever seen this plan.

**These questions are deliberately written without our vocabulary and without our answers.** A question
phrased in the language of a design already chosen can only find the gaps that design anticipated. The
point of this list is the opposite: to be answerable by someone who has never read a line of the plan,
so that a missing answer shows up as missing rather than as already handled.

**An honest "we refuse this, and here is why" is a complete answer. A silence is not.**

---

### 1 · Direction and intent — what the company is trying to do

What is this company for, and who is allowed to say? · How is a goal written down so it still means the
same thing in three months? · What separates a real commitment from an idea someone had? · How does an
instruction become binding, and how does the person giving it know it was understood the way they meant
it? · Who may set direction, and who may only propose? · How do you know a goal is finished? · Who
decides what matters most when two goals want the same resources? · What happens to a goal nobody has
touched in a long time? · How is a goal abandoned, and by whom? · What tells you a goal was the wrong
goal rather than badly executed? · How do you change a goal without losing the reason it existed? · How
far ahead should anything be planned? · What work is allowed to start without being asked for? · Where
do ideas go that are good but not now? · How does a goal that depends on another goal get sequenced? ·
What is off-limits entirely, and who wrote that list? · How does the company notice an opportunity it
was not looking for? · When does persistence become stubbornness?

### 2 · Work and tasks — how an intention becomes moves

How does something large become something a worker can actually start? · What is the smallest useful
unit of work? · How does a piece of work carry its purpose with it, so whoever picks it up knows why? ·
What states can work be in, and what moves it between them? · How much work should be in progress at
once? · What happens when work is blocked, and what would unblock it? · How many times should something
be attempted before it is treated as impossible? · How do you tell a new failure from the same failure
again? · If the same work runs twice by accident, what happens? · How is half-finished work handed to
someone else? · How is work stopped in the middle, and what is left behind? · Can stopped work be
resumed, and from where? · What does "done" mean for different kinds of work, and who checks? · What
evidence should accompany finished work? · How is rework counted, and does anyone notice when it is
high? · How do you trace a finished thing back to the decision that asked for it?

### 3 · Agents and the roster — who does the work

What roles need to exist, and how would you know if one is missing? · How many workers is the right
number, and what would tell you it is wrong? · Should a worker be a generalist or a specialist? · What
must never be done by the same worker that did something else? · Who is allowed to create a new role? ·
How does a role change over time? · When should a role be removed, and who notices that it should? · How
much should a new worker be trusted, and how does that change? · What does a worker have to do to be
given more freedom? · What takes freedom away again? · What can each worker actually reach, and who
decided? · How does a worker know what the others are doing? · How do you know a worker is alive and working rather than stuck or looping? · What happens when two workers disagree? ·
Who arbitrates, and on what basis? · How does a worker know a task is beyond it? · What must a worker
never hand to someone else? · How does a new worker learn how things are done here?

### 4 · How a worker thinks — the reasoning itself

When is it worth thinking longer, and when is that waste? · Should a plan be made before acting, and
when is planning procrastination? · How much should be understood before anything is changed? · How does
a worker tell what it knows from what it is assuming? · How does it express not being sure? · Is its
confidence actually related to being right? · When should it ask rather than decide? · When should it
decide rather than ask? · What makes it stop and say a thing cannot be done? · How does it notice it is
going in circles? · When a first attempt fails, is trying again from the same place a good idea? · How
does it avoid drifting from what it was actually asked? · What does it do when two instructions
conflict? · How does it check its own work without simply agreeing with itself? · How would it discover
that its whole approach was wrong, rather than its execution? · What does it do with something it could
not determine? · How does it avoid measuring the wrong thing and believing the result?

### 5 · Getting work to the right worker — orchestration

Who decides which worker does what? · How much context does a worker need to start, and how much is
too much? · When should work be split among several workers, and when does splitting cost more than it
saves? · How deep should delegation go before it becomes unmanageable? · What should a worker return
when it is finished, and how is that checked? · How do you stop two workers editing the same thing? ·
How do you know a message actually reached a worker? · What happens to a worker that has stopped
listening? · How is work redistributed when one worker is overloaded? · Whose job is it to notice that
the overall effort is off track? · What is lost when someone summarises another worker's findings? ·
How long is too long to wait for a result, and what does silence mean? · What happens to work that was
started and abandoned?

### 6 · Memory and context — what is remembered, and what is carried

What must a worker know before it can start, and where does it get it? · What is worth remembering
beyond a single piece of work? · How does the company remember a decision, as opposed to a fact? · What
should be forgotten on purpose? · How do you tell something that is still true from something that was
true when it was written? · What happens when the record contradicts itself? · Who is allowed to write
to memory, and who only reads? · How much can a worker hold at once, and what happens at the limit? ·
What is dropped first when there is not room for everything? · What does a worker lose when it starts
fresh, and does that matter? · How does a long piece of work survive being interrupted? · How is
knowledge shared between workers without shipping everything to everyone? · What should be remembered
about the person who owns the company — preferences, habits, past corrections? · How does the company
avoid learning the wrong lesson from one bad experience? · How does memory stay small enough to be
useful?

### 7 · Knowledge — what the company knows and how it learns

How does the company know what it knows? · Where does a fact come from, and when was it last true? ·
How are open questions tracked, so they do not quietly become assumptions? · What was tried before and
did not work, and how would anyone find that out? · How does a lesson get written down, and who decides
it is worth writing? · How is a lesson told apart from an anecdote? · What happens when two sources
disagree? · How do you handle not finding something — is that an answer or a gap? · How is knowledge
kept from going stale without re-checking everything constantly? · What knowledge exists only in one
worker's head, and what happens when that worker is gone? · How does someone new get up to speed
without reading everything? · How does the company avoid confidently repeating something it once got
wrong?

### 8 · Capability — what the company can actually do

What is the company capable of, and how is that written down? · How does a new capability get added? ·
How do you know a capability actually works rather than merely being listed? · How does a worker find
the right capability at the moment it needs it? · What happens when there are so many capabilities that
choosing between them becomes the hard part? · How do you tell an unused capability from an unnecessary
one? · What happens when two capabilities overlap? · Who is allowed to use what, and why not everyone? ·
When is it better to build a capability than to rent one? · When does a rented capability become a
dependency you cannot leave? · What obligations come with something borrowed from someone else?

### 9 · Reaching things — how the company touches the world

What can the company actually reach — files, accounts, services, the network, the machine itself? · Who
granted each of those, and can it be taken back? · How does the company know something worked, versus
appeared to work? · How does it tell a refusal from a failure? · What happens when something it depends
on is slow, or down, or has changed? · How much can one action cost before someone should be asked? ·
What is expensive enough to need permission every time? · What should never be reachable at all? · How
does a new connection get approved? · What record is kept of what was touched?

### 10 · What comes in from outside

Where does new information arrive from? · How does the company find out something happened without
watching constantly? · What is worth reacting to, and what can wait? · How does it avoid reacting twice
to the same thing? · How does it know it did not miss something while it was not looking? · What does it
do with a message that is trying to manipulate it? · How does it tell instructions from data? · Should
the thing that reads the outside world be the same thing that acts on it? · What happens when the volume
suddenly spikes? · How does it notice that a source has silently stopped sending?

### 11 · What goes out into the world

What may be sent, published, or spent without a person seeing it first? · Who is the company speaking
as? · How does anyone know a machine wrote it? · What cannot be taken back once it is out? · How is
something retracted, and what does that cost? · How does the company sound like itself rather than like
anything else? · What will it never say? · How does a first approach to a stranger differ from a
follow-up? · How much outward activity is too much? · What record is kept of what was said to whom? ·
Who is accountable when something goes out wrong?

### 12 · Communication — between workers, and with the owner

How does one worker tell another what it found and what it left undone? · How does a worker object to
something rather than silently comply? · How does a worker ask a question and keep working meanwhile? ·
What happens when nobody answers? · How does something reach the owner, and how urgently? · What is
worth waking a person for, and what can wait until morning? · How does a day's work get summarised so it
can actually be read? · What must never be softened or dropped when something is shortened? · How does
the owner give a correction that sticks? · How does the company know a correction was understood? · What
does a person need to see to feel in control without doing the work themselves?

### 13 · Truth — how the company knows what is actually so

What separates something the company measured from something it was told? · What separates something it
was told from something it inferred? · How is a statement substantiated, and by what? · What counts as
enough evidence for different kinds of claims? · How does a belief expire? · What happens when a belief
comes due and nobody has re-checked it? · Who is allowed to say a thing is settled? · How does the
company avoid believing itself simply because it said something confidently? · How does it record that
it does not know? · What does it do when the only available evidence comes from a source with an
interest in the answer? · How would the company discover it had been wrong about something for a long
time?

### 14 · Judging the work — quality and review

Who decides that work is good enough? · Should the thing that made it be involved in judging it? · What
is being judged — correctness, safety, cost, taste, all of them? · How does the standard differ by what
is at stake? · What cannot ship without review, and what can? · Can a review be overridden, and by whom? ·
How do you know a review was actually done rather than nodded through? · What makes two independent
reviews genuinely independent? · When several reviewers agree, does that mean more than one reviewer
agreeing with itself? · How much friction is review allowed to add before people avoid it? · How do you
test that the tests would actually notice a problem? · What happens to a defect nobody is going to fix
soon?

### 15 · Safety — what stops a bad thing happening

What is the worst thing that could plausibly happen here? · Which of those are accidents, which are
someone attacking, and which are the system misunderstanding? · How much damage can one bad action do
before anything notices? · What is easy to undo and what is not? · Which actions need a person, always? ·
What protection still works when nobody is watching? · How does the company stop something already in
progress? · How does it know the stop worked? · What happens if the protection itself fails — does
everything stop, or does everything continue? · What has never been rehearsed? · How would anyone notice
a protection that has quietly stopped protecting? · What is protected by nothing but a written rule?

### 16 · Permission and identity — who may do what

On what basis is permission granted — the person, the task, the risk, the reversibility? · How does the
company know who is asking? · What does a worker inherit from whoever started it, and what does it lose? ·
How is permission narrowed for a specific piece of work? · Where are credentials kept, and who can reach
them? · Should a worker ever hold the owner's own credentials? · How is access revoked quickly? · What
happens when a credential is unavailable — does work stop, or does it proceed without? · How does the
company avoid one worker being able to grant itself more access? · What outside rules constrain what may
be done at all, and who is keeping track of them?

### 17 · Where the work runs

What machine or machines does this run on, and what happens when they are unavailable? · How many things
can run at once before quality or speed suffers? · How would anyone notice that limit being crossed? ·
What does one unit of work cost in machine resources? · What happens when something started by something
else needs the same protections — does it get them? · How does the company tell a thing that failed from
a thing that did nothing? · What does a silent success look like, and how is it distinguished from a
real one? · How is work kept from interfering with other work? · What is recorded about a run so it can
be understood later? · What happens to work in progress when the machine sleeps or restarts?

### 18 · The thinking capacity itself — which minds do the work

How is it decided how much thinking a piece of work deserves? · When should something more capable be
brought in, and when is that waste? · What happens when the preferred capacity is unavailable? · Is
depending on a single supplier a risk worth taking? · What would it take to move to another? · How does
the company know whether a substitute did as well? · How does it notice that the same request now
produces a different quality of answer than it used to? · What are the terms of what is being used, and
do they permit this? · What limits exist, when do they reset, and which one actually binds? · What
happens when a limit is reached in the middle of something?

### 19 · When work happens

What decides that now is the time to do something? · What runs on a schedule and what runs in
response to an event? · What happens to scheduled work that was missed? · Should missed work all run, or
only the most recent? · How does the company know whether it is capable of doing the work right now? ·
What should it refuse to start rather than start badly? · How is unattended work different from
attended work? · What is safe to do while nobody is watching, and what is not? · How does the owner find
out what happened while they were away? · What should the system do when there is nothing that needs doing? · What happens to work that spans a gap in availability?

### 20 · Money, cost and value

What does this cost to run, and against what is that measured? · What is the difference between money
spent and capacity consumed? · How much may be spent without asking? · How is a budget divided between
competing work? · What happens at the ceiling — stop, ask, or continue? · How is exploratory work paid
for differently from committed work? · What does a finished piece of work cost, and does anyone track
that? · What is the cost of the owner's own time, and is it counted? · How does the company know whether
something was worth doing? · What is the unit economics of the thing being sold? · How is a price set? ·
When is it cheaper to buy than to build?

### 21 · How the owner sees and steers

What does the owner look at, and how often? · What is the first thing they see in the morning? · How is
a day's activity made comprehensible in a short time? · What is shown live and what is a record? · How
does the owner intervene mid-flight? · How is a decision put to them, and what makes a good one? · How
many decisions is too many in one sitting? · What does the owner need in order to trust a summary they
did not verify? · How does the interface avoid claiming more certainty than exists? · What should be
visible from a phone, standing up, in thirty seconds? · How does someone catch up after being away for
a week?

### 22 · The boundary around the owner

Which decisions genuinely require this particular person? · What can be decided without them and simply
recorded? · How is a past decision revisited without re-arguing it from scratch? · What is settled and
must not be reopened? · How does the company know when it has spent too much of their attention? · What
happens when they are unreachable? · What happens when they change their mind? · How is a decision
recorded so that a stranger reading it later understands why? · What happens to this company if that
person is not available for a month? · How does the owner stay in charge without becoming the
bottleneck?

### 23 · Getting better over time

How does the company notice it did something badly? · How does a lesson become a change in how things
are done? · Who approves a change to the company's own rules? · How do you tell an improvement from a
change? · How would you know a change made things worse? · What is measured to say the company is better
this month than last? · How does it learn from work that succeeded, not only from failures? · What
should be reviewed periodically even when nothing seems wrong? · How does the company avoid changing
itself so often that nothing stabilises? · What would falsify the whole approach?

### 24 · Running more than one thing at once

What makes two efforts genuinely separate? · What should be shared between them, and what must not be? ·
How is attention divided when both want it? · How does one effort's failure stay contained? · When is a
new effort worth starting? · What does it take to pause one and wake it months later, and what rots while it sleeps? · When should one be stopped, and who decides? · How is each judged, given
they may be at different stages? · What does the owner see across all of them at once? · How does
something learned in one get used in another without contaminating it?

### 25 · The kinds of work a company has to do

Deciding what to build and for whom · designing how it looks and feels · building it · testing it ·
running it once it exists · finding the people who might want it · talking to them · selling · supporting
them afterwards · keeping the books · staying on the right side of rules and contracts · researching
what is true about the market · negotiating with suppliers · hiring and its equivalent here · and the
question underneath all of them: does each of these need its own worker, or is it a way of working that
any worker can adopt?

### 26 · Information about people

What information does the company hold, and about whom? · Where did it come from and was it given
willingly? · How long is it kept, and what causes it to be deleted? · Is deletion real? · What leaves
this machine, and to whom? · What can the company learn about the person who owns it, and is that
consented to? · What is recorded about a customer that they would be surprised by? · What should never
be stored at all? · Who can see what, and is that logged?

### 27 · Rules from outside

What outside rules apply here, and who is tracking them? · What are the terms of the services being
used, and do they permit this use? · What obligations come with borrowed material? · Who may enter into
an agreement on the company's behalf? · What must be disclosed, and to whom? · What claims may be made
publicly, and what must be substantiated first? · What actions may only be taken by a human being? ·
When is it time to ask a professional rather than work it out internally? · Who is liable when something
goes wrong?

### 28 · Keeping it running

How does something get from finished to actually live? · What must pass before that happens? · How is it
undone if it turns out to be wrong? · Which changes cannot be undone? · How does anyone know the system
is healthy right now? · Who is told when it is not? · What happens at three in the morning when there is
only one person? · What is backed up, and has restoring it ever been tried? · What happens if the machine
is lost entirely? · How much downtime is actually acceptable here?

### 29 · Being seen from outside

Who is the audience, and what do they already believe? · What does the company say it is? · Where do
people encounter it? · How is attention earned rather than bought? · What is published, how often, and
by whom? · How is a first impression handled differently from an ongoing relationship? · What does a
public mistake cost, and how is it corrected? · How is real interest told apart from vanity numbers? ·
What reputation is being built, and would the owner be comfortable if it were described back to them?

### 30 · How the company holds itself together

What does this company value, and how would that show up in a hard decision? · How does someone new —
person or worker — learn how things are done? · What must a newcomer be told not to re-open? · What
record is kept of a period of work, and who reads it later? · How is an account written for whoever comes next, so it is
still useful in six months? · How does the company keep its history without drowning in it? · How is a
correction recorded alongside what it corrected, rather than instead of it? · What does the company do
when it discovers it has been telling itself something untrue?

### 31 · When things go wrong

What kinds of failure are there, and are they treated differently? · How is a failure that announces
itself distinguished from one that does not? · How would anyone notice a check that passes without
checking anything? · How is an intermittent problem told from a consistent one? · What happens to work
that was interrupted halfway? · What happens when two things changed the same thing at once? · How is
conflicting evidence about one event reconciled? · What does the company do when it cannot tell whether
it succeeded? · How does it degrade — badly all at once, or gracefully? · What is the first thing to
check when something is wrong?

### 32 · Knowing what is actually true about itself

For each thing the company believes about itself, what would show it to be false? · Is the measurement
capable of returning a bad answer if there were one? · Was the right unit chosen before measuring, or
after? · Is there a case where the expected result does not appear, to prove the test works? · Does one
observation count as a result? · How is a change told apart from noise? · When the baseline is moving,
what is safe to claim? · Is a number written down, or the way to work it out again? · Who checks the
thing that does the checking? · What has never been measured because nobody thought to?

---

### The machinery itself

*Fields 1–32 are company-shaped: they would be asked of any organisation, staffed by people or not.
The ones below are specific to a system built out of models and agents. **They are here because a
subject with no field of its own gets thought about only when it breaks.** Several are currently
buried inside an abstraction above — instructions inside "how a worker thinks", connections inside
"reaching things" — and buried is not the same as covered.*

### 33 · Instructions — the words that steer behaviour

What is actually written down to make a worker behave the way it should? · Who writes it, and who is
allowed to change it? · How long should an instruction be before it stops being read properly? · What
belongs in a standing instruction versus in the request itself? · How do you tell an instruction that is
working from one everybody ignores? · What happens when two instructions conflict, and which wins? · How
is an instruction tested before it is relied on? · How would you know an instruction had quietly stopped
being followed? · What happens to instructions as the models underneath them change? · How much of
behaviour should come from written instruction versus from what the model already knows? · When is the
right fix a better instruction, and when is it a different mechanism entirely? · How is an instruction
versioned, and can you tell which version produced a given result? · What must never be put in an
instruction because instructions can be read by whoever the work touches?

### 34 · Skills — packaged know-how the system can pick up

What is the unit of reusable know-how here, and what is inside one? · When is something worth writing
down as reusable rather than doing once? · How does a worker find the right one at the moment it needs
it, without reading everything? · What does it cost to look, and does that cost grow as the collection
grows? · At what size does having more start making selection worse? · How do you tell an unused one
from an unnecessary one? · What happens when two of them overlap or contradict? · Who is allowed to
write one, and who reviews it? · How is one kept current when the thing it describes changes? · How
would you know one is being loaded and then not actually followed? · Should they carry examples, and
what does a stale example do? · Where do they come from — written here, borrowed, or bought — and what
comes with borrowed ones?

### 35 · Connections to outside systems

What does it take to let the system use a service it did not build? · Who decides which outside services
are connected at all? · What does connecting one actually expose — read, write, spend, or act as you? ·
How do you know what a connected service can really do, versus what it says it does? · What happens when
one changes underneath you without telling you? · What happens when one is down, slow, or returns
something unexpected? · How is a connection's access narrowed to only what one piece of work needs? ·
Can a connected service influence the system's behaviour through what it returns? · How is a connection
removed, and how do you know nothing still depends on it? · What is the audit trail of what a connection
was used for? · How many connections is too many to reason about? · What should never be connected?

### 36 · Using a tool — the act itself

How does a worker decide which tool to reach for? · How does it know a tool did what it asked, versus
appearing to? · What does it do with an unexpected result — retry, adapt, or stop? · How many attempts
before a tool is treated as unavailable? · What happens when several tools could do the job? · How is a
tool that is dangerous in one context and routine in another handled? · Should a worker be able to use a
tool it has never used before, without asking? · How is tool output kept from being confused with
instruction? · What does the system do when a tool's answer contradicts something it already believed? ·
How much of a tool's output should be kept, and for how long? · How is the cost of a tool call known
before it is made?

### 37 · Workflows — when the path is fixed and when it is chosen

Which work should follow a fixed sequence, and which should be figured out as it goes? · Who decides
which of those a given piece of work is? · What is gained by scripting a path, and what is lost? · How
does a fixed path handle the case it did not anticipate? · How does a decided path avoid wandering? ·
Where are the points a person must approve before it continues? · What happens if a step fails halfway —
does the whole thing unwind, and can it? · Can a run be picked up from the middle after an interruption? ·
How do you avoid two runs of the same thing doing the work twice? · How long may a single run take before
something is wrong? · How is a long-running process observed while it is still going? · When a path is
changed, what happens to work already in flight under the old one?

### 38 · Stages — the shape of work over its life

What stages does a piece of work pass through, and who says it has moved? · What must be true to leave
each one? · Which stages can be skipped and which never? · Where does work most often get stuck, and is
that visible? · What happens to work that sits in one stage too long? · Should different kinds of work
have different stages? · How much ceremony is worth it for small work? · What does the stage tell you
that the status does not? · Who is allowed to move something backwards?

### 39 · Delegation — the shape of one worker using another

When should a worker do something itself rather than hand it on? · How deep should that go before nobody
can follow it? · How does a worker describe a task well enough that another can start? · How much
context travels with a delegated task, and how much is too much? · What comes back, and in what form? ·
How is a delegated result checked before being used? · What happens when a delegated worker fails or
never returns? · Who is accountable for delegated work — the one who did it or the one who asked? · How
do you stop delegation being used to avoid a hard judgement? · What should never be delegated onwards?

### 40 · Knowing whether the behaviour is any good

How do you tell whether the system is behaving well, as opposed to producing output? · What does good
look like for work that has no single right answer? · Who or what does the judging, and what judges the
judge? · How do you compare this month against last month fairly? · What is the fixed set of cases that
never changes, so that change can be seen? · How do you notice a gradual decline as opposed to a sudden
break? · How much of judgement can be automated before it stops measuring what you care about? · What is
measured on real work versus on rehearsals? · How do you avoid improving the score without improving the
thing? · What would tell you the measurement itself has stopped working?

### 41 · Testing and change — knowing a change did not break something

How do you know a change to how the system works made things better? · What is checked before a change
takes effect? · How do you test something whose output is different every time? · What does a
regression look like here, and how quickly is it noticed? · How is a change rolled out — everywhere at
once, or gradually? · How is it undone? · What changes cannot be undone? · How is the system's own
configuration versioned, and can you reproduce a past result? · Who is allowed to change the way the
system works, and does that differ from who can change what it works on? · What is the record of what
changed, when, and why?

### 42 · Seeing inside a run

While something is running, what can be seen? · After it finishes, what can be reconstructed? · How much
detail is kept, for how long, and at what cost? · How do you follow one piece of work through many
workers and steps? · How do you find the moment something went wrong in a long run? · What is recorded
about every decision — the choice, the reasoning, both, neither? · Is what is recorded enough to explain
a result to someone who was not there? · What is deliberately not recorded, and why? · How is all this
kept useful rather than becoming an unreadable pile?

### 43 · Guardrails — the checks that sit around behaviour

What checks run before an action, and what runs after? · What is checked deterministically versus by
judgement? · What happens when a check is unsure? · Does a check fail open or closed, and was that
chosen? · How much do the checks cost in time and money? · How would you know a check has stopped
checking while still passing? · Who can add a check, and who can remove one? · What is checked on the way
in — the request — versus on the way out? · Are the same checks applied to work the system does for
itself as to work it does for a customer?

### 44 · Grounding — where an answer's facts come from

When should the system look something up rather than rely on what it knows? · How does it decide what to
look at out of everything available? · How does it know the thing it found is current? · What happens
when sources disagree? · How does an answer show where it came from? · What stops a plausible-sounding
answer with no source behind it? · How is a large body of material made searchable without losing what
matters? · What is the cost of looking, and when is it not worth it? · How is a large body of material kept searchable as it grows, and who notices when search stops working? · How does looked-up material get
kept apart from instruction?

### 45 · The shape of what passes between steps

What form does a result take when it moves from one step to the next? · How strict should that form be? ·
What happens when something does not fit it? · How much freedom does a worker have in what it returns? ·
How do you keep a chain of steps from degrading a little at each one? · How is meaning preserved when
something is summarised for the next step? · What must survive every handover no matter what — the
warnings, the numbers, the things that could not be determined? · How is a partial or uncertain result
expressed rather than smoothed over?

### 46 · Where a person sits inside the work

Which steps require a person, and is that because of risk or because of taste? · How does a person get
enough context to decide quickly? · What happens while waiting for them? · What happens if they do not
respond? · Is there a difference between approving and merely not objecting? · How is a person's
decision recorded so it can be applied consistently next time? · How do you avoid asking a person things
they have already effectively answered? · How do you stop a person becoming a rubber stamp? · What
should never wait for a person, because waiting is worse than deciding?

### 47 · The system changing itself

What parts of itself may the system propose changes to? · What may it change without asking? · How is a
proposed change evaluated before it is accepted? · How do you tell an improvement from a change? · What
stops it drifting somewhere nobody chose, one small change at a time? · How is a change to the rules
distinguished from a change to the work? · If it can rewrite its own instructions, what stops it
rewriting the ones that constrain it? · How often should it be allowed to change, and does constant
change prevent anything settling? · What is the record of what it changed about itself and why?

### 48 · Reproducibility

Can the same request twice give the same answer, and should it? · When does variation matter and when is
it fine? · What has to be recorded to explain a past result? · If something went wrong three weeks ago,
can it be reproduced? · What changed underneath — models, instructions, connections, data — and is that
knowable? · How much does pinning everything down cost, and what does it cost not to? · What is the
minimum that must be captured for an answer to be defensible later?

### 49 · Using one source of judgement against another

Is a second opinion worth anything if it comes from the same place as the first? · What makes two
opinions genuinely independent rather than the same reasoning twice? · When is it worth having one
worker check another's work, and when does that just double the cost? · Should the checker know what the
producer concluded, or judge blind? · What happens when they disagree — who breaks the tie, and on what
basis? · Is agreement between two similar sources evidence, or only correlation? · What is the cheapest
way to get a genuinely different perspective? · When is disagreement a sign that something is hard
rather than that someone is wrong? · How do you keep a checker from drifting into agreeing by default? ·
What kinds of work benefit from a second look and what kinds do not?

### 50 · Questioning what is already settled

How does anything settled ever get re-opened? · What triggers a re-examination — time, a bad outcome,
someone noticing? · Who is allowed to ask why something exists, and does anyone have to answer? · How do
you tell a decision that is still right from one nobody has revisited? · What stops the system
calcifying around choices made when it knew less? · What stops the opposite — churning, so nothing ever
settles? · How does a newcomer's naive question get taken seriously rather than explained away? · Who
argues the other side when everyone already agrees? · How would the company notice that its whole
approach had been overtaken by something better? · What is deliberately not up for re-examination, and
who decided that?

### 51 · When there is more than one person

What changes when a second person is involved — a partner, a contractor, someone hired? · Who decides
what, and is that written down anywhere? · How does someone else get enough context to be useful without
reading everything? · What can a second person do that the owner cannot, and the reverse? · How is work
handed between two people, as opposed to between workers? · What happens to accountability when it is
shared? · How does the system know which human it is talking to, and should it treat them differently? ·
What would have to be true for someone to take over entirely? · How does a person leave, and what goes
with them? · If this stays a company of one, is that a choice or a limitation?

### 52 · Building this, and moving to it

What gets built first, and what decides that? · How do you avoid building the whole thing before finding
out whether any of it works? · What is the smallest version that would prove or disprove the idea? · How
do you move from working the current way to working this way, without a gap where nothing works? · What
runs in parallel during the transition, and for how long? · How do you compare the new way against the
old fairly, rather than against a memory of the old? · What is the baseline, and was it measured before
anything changed? · How do you keep adding without accumulating — does each new part replace something,
or merely sit alongside it? · What would tell you to stop building and start using? · What is the honest
sequence, given that some things cannot be built until others exist?

### 53 · What a business needs in order to actually exist

What does it take for an effort to be a real thing that can transact — an entity, an account, a way to
take money, an address, a name nobody else owns? · Who or what can legally enter into an agreement? ·
What is needed before a single stranger can pay? · What obligations begin the moment money changes
hands? · What has to be filed, when, and by whom? · How separate is each effort legally and financially,
and what does mixing them cost? · What happens to all of that when something is wound down — what must be
closed, informed, kept, or destroyed? · Which of these can be set up in an afternoon and which take
weeks, and does the plan account for that? · What can be deferred until there is revenue, and what
genuinely cannot?

## Part three · The sectors

**A field asks whether the machine works. A sector asks where it is allowed to operate, and what it
touches whether it means to or not.** All three lanes split the word the same way without conferring —
one axis for *where*, one for *what it affects* — and two of the three independently said the first list
must function as a **gate rather than a menu**. That is how it is written here.

### 3.1 · Operating sectors — where such a company could work, and what stops it

**The gate on each is not difficulty. It is who else has authority over what counts as done.**

`OPEN` capability and trust are the only limits · `LICENCE` a licensed human must sign, and no amount of
capability opens it · `PRESENCE` a body has to be somewhere · `CONSENT` the counterparty must be willing
to deal with a business run this way · `IRREVERSIBLE` failure cannot be undone by refunding the money ·
`REFUSE` the honest default until something changes

**Software and information** — developer tools `OPEN` · consumer apps `OPEN` · business software `OPEN` ·
data products and analysis `OPEN` · APIs and infrastructure `OPEN` · games and interactive `OPEN` ·
research and synthesis `OPEN` · education and courseware `OPEN` · publishing, writing, media `OPEN`

**Services** — consulting and advisory `CONSENT` · design services `CONSENT` · marketing and content
services `OPEN` · recruiting `CONSENT` · bookkeeping `LICENCE` at the filing boundary · translation and
localisation `OPEN` · customer support as a service `CONSENT`

**Commerce** — digital goods `OPEN` · print-on-demand and dropship `PRESENCE` at fulfilment ·
marketplaces `CONSENT` · subscription boxes `PRESENCE` · wholesale `PRESENCE` · physical retail
`PRESENCE`

**Regulated** — anything financial: lending, advice, brokerage, payments `LICENCE` · insurance `LICENCE` ·
health and anything clinical `LICENCE` `IRREVERSIBLE` · legal services `LICENCE` · pharmaceutical, food,
safety-critical `LICENCE` `IRREVERSIBLE` · children's products and services `IRREVERSIBLE` `REFUSE` ·
employment and anything touching someone's livelihood `LICENCE` `IRREVERSIBLE`

**Physical and heavy** — manufacturing `PRESENCE` · logistics `PRESENCE` · construction and trades
`PRESENCE` `LICENCE` · hospitality `PRESENCE` · agriculture `PRESENCE` · energy and utilities `LICENCE`
`IRREVERSIBLE`

**Where the shape matters more than any row.** The top block is gated only by whether the system can be
trusted — which is the thing being built, so those sectors open as it improves. The regulated block is
gated by someone else's licence, which capability **never** opens; the only route is a licensed human in
the loop, and that is a business model decision rather than an engineering one. The physical block is
gated by matter, and no amount of intelligence moves a box. **A strategy that ignores which gate it is
facing will spend years on the wrong one.**

### 3.2 · Sectors of consequence — what the ambition touches whether it intends to

**These do not appear in a field map, because a field map describes a machine and these describe what
happens around it.**

**The owner** — their competence over time · their attention as a finite and shrinking resource · what
their days become · whether they still enjoy it · isolation from colleagues who no longer exist · their
identity as a builder versus a judge · the residue of unpleasant decisions · burnout without the usual
warning signs · what happens to them if it stops working

**Standing and liability** — who is liable for what the machine says · disclosure obligations · what
"reasonable diligence" means when nobody watched · whether insurance responds at all · contract
capacity · consumer protection · cross-border exposure · the fact that a court has already held the
deployer responsible for the machine's words

**Trust over time** — how a customer feels on learning how the work was done · what disclosure costs and
what concealment costs more · the first public mistake · reputation that cannot be rebuilt at this scale ·
whether "small and personal" survives contact with the truth

**Continuity** — what happens if the owner is ill for a month · succession · what a buyer would actually
be buying · whether the thing is portable off any one vendor · vendor churn as a standing tax · what is
owned versus rented, and what happens when the rented part is retired

**Scale and its own failures** — coordination cost rising faster than output · quality drifting with no
outside anchor · optimising a proxy nobody chose · decisions nobody can later reconstruct · sprawl the
owner has stopped tracking · the successful version's failure mode, which looks like success for a while

**Security and adversaries** — the system acting on text an attacker wrote · credentials in an
unattended process · an adversary who learns how it decides · impersonation in the company's name ·
what one compromised run can reach

**Outward effects** — competition when many people have this · what happens to prices when the supply of
"a company" rises · displacement of the exact work this replaces · verification as a public good this
solves privately while worsening publicly · what a market looks like when most participants are run this
way

### 3.3 · Stage — the axis nobody usually lists

**A many-cheap-attempts strategy makes the unglamorous stages into core capabilities**, and a design that
only imagines building will be missing half of what it needs.

Deciding what to try · validating before building · building · first contact with strangers · early
customers · steady operation · growth · maintenance and the long tail · **winding down** · the postmortem
that makes the next attempt cheaper

**Winding down deserves its own line.** If being wrong most of the time is the plan, then killing things
well — refunding, informing, closing accounts, keeping the record, extracting the lesson — is not an
afterthought. **It is the capability that makes the strategy affordable**, and it is the one nobody
builds until they need it badly.

---

*The full enumerations, each with its own reasoning and the disagreements between them, are in
`vision/A-ambition.md`, `vision/B-sceptic.md` and `vision/C-consequences.md`. Where those three
disagree, they have not been reconciled here on purpose — the disagreement is the useful part.*
