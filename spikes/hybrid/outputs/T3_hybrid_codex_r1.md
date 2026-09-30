## COPY

**Subject option 1:** It’s not the tax. It’s the surprise.

**Subject option 2:** Move tax money before you see it

**Preheader:** Less mental math. Tax money set aside automatically.

**Body:**

Not knowing what you’ll owe is the hard part.

You haven’t connected a bank yet, so Keel isn’t setting money aside.

Connect your bank and Keel will automatically move a calculated percentage of incoming client payments into a separate tax pot, keep a running estimate of what you owe, and remind you before quarterly deadlines.

Less mental math every time a client pays. Less wondering whether your estimate is still right.

Bank connection is through Plaid. Keel doesn’t file your taxes. Your 14-day trial requires no card.

**CTA:** Connect my bank

## TEST PLAN

- **Design:** Randomize eligible day-2 users 1:1 between the current control and this email using **subject option 1**. Option 2 remains untested. Hold sender, timing, destination, and subsequent messaging constant. Test the complete email package.
- **Eligibility:** Still unconnected immediately before sending; one assignment per user. Assume steady traffic and a baseline applicable to this population.
- **Primary metric:** Users successfully connecting a bank within seven days ÷ all eligible randomized recipients, including those who never open or click.
- **Hypotheses:** H0: \(p_T=p_C\). H1: \(p_T\ne p_C\).
- **Preselected MDE:** **15% relative**, or **6.15 percentage points absolute**: 41% → 47.15%. Two-sided α = .05; power = 80%.

**Sample size per arm:**

\[
\bar p=(.41+.4715)/2=.44075
\]

\[
n=\frac{\left(1.96\sqrt{2(.44075)(.55925)}
+.8416\sqrt{(.41)(.59)+(.4715)(.5285)}\right)^2}
{(.4715-.41)^2}
\]

\[
n\approx\frac{3.86491}{.00378225}=1{,}021.86
\Rightarrow \mathbf{1{,}022\ per\ arm}
\]

**Fixed horizon:** \(1,800 \times .55=990\) recipients/week; 495/arm/week. Enrollment requires \(1,022/495=2.06\) weeks, rounded up to **three full weeks**, yielding approximately 1,485/arm. Wait seven additional days for outcomes: **four weeks total**. Adequately powered within eight weeks.

**Decision:** Analyze once after the fixed horizon; no interim efficacy checks or significance-based extensions. Report absolute lift, relative lift, and a 95% confidence interval. Ship if the two-sided test is significant, lift is positive, and guardrails pass; otherwise call the result inconclusive or harmful as appropriate.

**Guardrails:** Unsubscribes/recipients, spam complaints/recipients, and failed bank connections/connection attempts. Assumed operational tolerances: treatment increases below 0.5, 0.1, and 2 percentage points, respectively. These are rollout checks; rare harms may remain uncertain.

## RATIONALE

The corpus suggests three pains: uncertainty, spendable-looking tax money, and recurring manual effort.

- **Subject 1 — Q6, Q18:** Ambiguity aversion; names the surprise customers dread.
- **Subject 2 — Q2, Q4:** Mental accounting and precommitment; separates tax money before it feels spendable.
- **Preheader — Q3, Q4, Q10:** Effort reduction; replaces repeated arithmetic with automatic action.
- **Body — Q6, Q7, Q17:** Ambiguity reduction; connects setup to a running estimate and money set aside. Q3/Q4 support automatic transfers; Q1/Q11 support reminders.
- **Action-adjacent reassurance — Q12, Q16:** Trust calibration and expectation setting; names Plaid and clarifies filing scope without inventing security guarantees. Trial terms come from supplied product facts.
- **CTA — Q4, Q17:** Action specificity; makes the prerequisite for the desired automation explicit.