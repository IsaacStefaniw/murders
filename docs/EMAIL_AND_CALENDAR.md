# Email and calendar: what works now, what needs building, what it costs

Isaac asked two related things: email the work review questions through,
because the growth block fires while he is at work and a phone is the
wrong surface; and send calendar invites to a partner's email so shared
items land in Anna's diary.

They look like one feature and they are three, separated by how much
infrastructure each needs. This is the assessment before any of it is
built, because two of the three have consequences that are not obvious
from the ask.

---

## 1. Sending things OUT of the app — built, shipping now

**Status: done, in this branch.**

The OS share sheet already has Mail, Messages and Notes in it. Reaching it
costs nothing: `Share` is part of React Native, so no native dependency and
no change to the expo-updates fingerprint — which matters, because a
fingerprint change cuts every installed build off from over-the-air updates
until a new build ships.

- The weekly review has a **Send these questions to myself** button. It
  carries the questions named for the right week, the date range, and where
  the goal currently stands.
- The household hub's "send the week" button now works. It previously
  called `navigator.clipboard.writeText`, a web API that does not exist on
  iOS — the TypeError was swallowed by a `catch` commented "clipboard
  unavailable, nothing to break", so on every device the app actually ships
  to, the button did nothing and said nothing.

This is genuinely most of the value. Isaac answers the review in his email
client at his desk, which is what he asked for, and brings the one lever
back into the app.

---

## 2. A real calendar invite to a partner — buildable, needs a new build

**Status: not built. Small, and it has a cost worth naming.**

An `.ics` file is plain text, so IntentNorth can generate a genuine
invite — one that lands in Anna's calendar as an invite rather than as a
message about one — with no server involved.

The catch is attachment. `Share.share({ message })` sends text; a file
needs a file URL, which means `expo-file-system` to write the `.ics` and
`expo-sharing` to attach it. Both are native modules, so:

- **The fingerprint changes.** Installed builds stop receiving OTA updates
  until a new TestFlight build ships. That is the real cost — not the code,
  which is perhaps half a day including tests.
- No account, no server, no ongoing cost. The invite is generated on the
  device and handed to the OS.

**Worth doing**, and worth batching with the next fingerprint-changing
change rather than spending a build on alone.

What it cannot do: know whether Anna accepted. That is sync, which is §3.

---

## 3. The return leg — email replies landing back in the app

**Status: not built, and the assessment is that it should not be next.**

"Email it to me, I reply, and the app updates" needs infrastructure the
project does not have:

- **A sending domain** with SPF, DKIM and DMARC configured, or the mail
  goes to spam and the feature silently fails in the way that is hardest to
  debug — it looks like the user ignored it.
- **Inbound parsing.** A service to receive replies, match them to a
  person and a goal, and extract answers from free text that will include
  quoted originals, signatures and mobile-client formatting.
- **A backend at all.** The app is on-device today. Every plan, metric and
  reflection lives in local storage and nothing leaves the phone. Email
  round-trip means user content on a server, which changes the privacy
  position from "it cannot leave" to "it does, and here is how it is
  protected" — a change to the privacy policy, the App Store data
  disclosure, and what can honestly be claimed on the website.
- **Consent.** Under the Australian Spam Act 2003, sending commercial
  electronic messages needs consent, accurate sender identification and a
  functional unsubscribe. A review a person asked to be sent to themselves
  is a transactional message and sits on the right side of that line;
  anything that drifts toward "we email you prompts" does not.

**Recommendation: do not build this yet.** §1 gets Isaac the practical
outcome — questions at his desk, answered where he is already typing — for
none of that cost. The return leg is worth revisiting when there is a
backend for another reason, not as the reason to build one.

The honest interim: answer in email, then bring the one lever back into the
app. One paste, once a week, against a server, a domain and a privacy
position.

---

## 4. Partner sync — named here so it is not confused with §2

Sending Anna an invite is not the same as her having an account, seeing the
shared week, or her acceptance reaching the plan. The paywall already lists
partner sync under **Not built yet**, and that must stay accurate: the
claims tests exist because copy drifted ahead of the code once already.

An invite in §2 is a one-way message. Anything two-way is §3's
infrastructure plus an identity model.
