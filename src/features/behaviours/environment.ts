/**
 * The setup, per behaviour: change the room, not the person.
 *
 * Habits run on cues, and the most reliable way not to act on a cue is not
 * to meet it. Field work moves how much people eat, drink and scroll by
 * changing what is visible, how near it sits and what size it comes in,
 * with nobody deciding to consume less. The people who score highest on
 * self-control turn out to be people who arrange their lives around fewer
 * temptations, not people who win more fights with them.
 *
 * So each behaviour gets a short checklist of things to move, delete,
 * switch off or put away — the kind of change that is done once in
 * daylight and then works every night without a decision. Each is written
 * as a thing to do, not a thing to stop. Where the evidence is about
 * distance, the item says how far; where it is about friction, the item
 * names the friction.
 *
 * One guard, and it matters: clearing the house is the right move for the
 * phone, the biscuits and the betting app. It is not the first move for
 * someone who drinks every day, because stopping suddenly after heavy
 * daily drinking can be medically dangerous. That line is on the alcohol
 * list, above the items.
 */

import type { BehaviourKey } from '@/types/domain';

export interface EnvironmentItem {
  id: string;
  text: string;
}

const item = (id: string, text: string): EnvironmentItem => ({ id, text });

/** A GP or quitline roughly doubles the odds; the setup is not instead of that. */
const NICOTINE_SUPPORT = item(
  'nicotine-support',
  'Ask a GP or a quitline about nicotine replacement. It roughly doubles the odds, and this list is not instead of it.',
);

export const ENVIRONMENT_CHECKLIST: Record<BehaviourKey, EnvironmentItem[]> = {
  doomscrolling: [
    item('charge-kitchen', 'Charge the phone in the kitchen, not by the bed.'),
    item('notifications-people', 'Turn off every notification that is not a person.'),
    item('greyscale-evening', 'Set the screen to black and white after 8pm. Colour is a large part of the pull.'),
    item('news-off-front', 'Move the news and feed apps off the first screen, or delete them and use the browser.'),
    item('pause-app', 'A one-second pause before the app opens, if you use a pause app. A third of opens never happen after it.'),
  ],
  alcohol: [
    item('none-on-off-nights', 'Nothing in the house on the nights you named as off.'),
    item('other-drink-ready', 'A drink you like that is not alcohol, cold and ready, in the place the beer was.'),
    item('smaller-glass', 'Smaller glasses. The pour follows the glass.'),
    item('number-first', 'Decide the number before the first one, and say it to someone.'),
  ],
  vaping: [
    item('charge-far', 'Charge it somewhere that takes a walk to reach — not the bedside, not the desk.'),
    item('leave-home', 'Leave it at home on the errands you can.'),
    item('hands-pocket', 'Something for your hands in the pocket it lived in.'),
    NICOTINE_SUPPORT,
  ],
  smoking: [
    item('none-house-car', 'Nothing in the house or the car by tonight.'),
    item('lighter-with-packet', 'The lighter goes wherever the packet goes.'),
    item('coffee-elsewhere', 'Coffee somewhere the cigarette never was. The cue is the chair, not the coffee.'),
    NICOTINE_SUPPORT,
  ],
  social_media: [
    item('log-out', 'Log out, so opening it costs a password.'),
    item('feed-notifications-off', 'Notifications off for every feed.'),
    item('browser-only', 'Off the first screen; the browser version only.'),
    item('pause-app', 'A one-second pause before the app opens, if you use a pause app.'),
  ],
  gaming: [
    item('put-away', 'Controller and console put away after the session, not left out.'),
    item('stop-time', 'A stop time on a timer, set before you start, not during.'),
    item('morning-reason', 'Tomorrow’s first thing decided, so the night has an end.'),
  ],
  porn: [
    item('phone-out-bedroom', 'The phone charges outside the bedroom.'),
    item('blocker-daylight', 'A blocker on the browser, set up in daylight when it is easy.'),
    item('restless-hour', 'Something already chosen for the restless hour — a walk, a call, a shower.'),
  ],
  shopping: [
    item('cards-deleted', 'Card details deleted from the shopping apps and the browser.'),
    item('unsubscribe', 'Unsubscribe from the sale emails today.'),
    item('waiting-list', 'A waiting list: anything over an amount you choose waits a day on the list.'),
  ],
  gambling: [
    item('bank-block', 'A gambling block on the bank card, switched on today. It works better than intention.'),
    item('self-exclude', 'Self-exclusion from the apps and venues you use.'),
    item('accounts-closed', 'Betting apps deleted and the accounts closed — not just logged out.'),
    item('helpline-saved', 'A free, confidential helpline saved in the phone. It asks for no name.'),
  ],
  junk_food: [
    item('takeaway-apps-off', 'The takeaway apps off the phone.'),
    item('quick-real-meal', 'Something quick and real in the fridge for the night you cannot cook.'),
    item('kitchen-closed', 'The kitchen closed about three hours before bed.'),
  ],
  sugar: [
    item('out-of-reach', 'Not in the house, or somewhere that takes effort to reach.'),
    item('swap-on-shelf', 'Fruit and something with protein where the biscuits were.'),
    item('smaller-packets', 'Smaller packets. The amount follows the packet.'),
  ],
  late_caffeine: [
    item('cutoff-written', 'A cutoff hour written where the coffee is made.'),
    item('decaf-shelf', 'Decaf or tea on the shelf for the afternoon.'),
    item('slump-walk', 'The afternoon slump answered with ten minutes outside.'),
  ],
  late_nights: [
    item('wind-down-alarm', 'An alarm for winding down, not only for waking.'),
    item('screens-out', 'Screens out of the bedroom.'),
    item('morning-reason', 'Tomorrow’s first thing decided, so the night has a reason to end.'),
  ],
  phone_in_bed: [
    item('charge-elsewhere', 'Charge it in another room. The single change with the best evidence behind it.'),
    item('alarm-clock', 'A cheap alarm clock, so the phone has no job in the bedroom.'),
    item('book-on-pillow', 'A book on the pillow.'),
  ],
  overworking: [
    item('shutdown-line', 'A shutdown line: the last task written down, the laptop closed and put away.'),
    item('email-off-phone', 'Work email off the phone, or its notifications off after the hour you chose.'),
    item('evening-booked', 'The evening thing booked, so the work has to stop.'),
  ],
  procrastination: [
    item('first-two-minutes', 'The first two minutes of the thing written as a step, not a project.'),
    item('tab-ready', 'The file open and the tab ready before you leave the desk.'),
    item('phone-other-room', 'The phone in another room for the first block.'),
  ],
};

/**
 * The line above the list, where the list could do harm on its own.
 * Alcohol only, for now: an empty cupboard is the wrong first move for
 * daily heavy drinking.
 */
export const ENVIRONMENT_GUARD: Partial<Record<BehaviourKey, string>> = {
  alcohol:
    'If you drink every day, clearing the house is not the first move. Stopping suddenly after heavy daily drinking can be dangerous — shakes, sweating or a racing heart without a drink is a doctor’s call before anything on this list.',
};

/** Item ids the person has ticked, kept comma-joined on the path's answers. */
export function environmentDone(answers: Record<string, string>): Set<string> {
  const raw = answers.environmentDone;
  return new Set(raw ? raw.split(',').filter(Boolean) : []);
}

/** The `environmentDone` value with this item toggled. */
export function toggleEnvironmentItem(answers: Record<string, string>, id: string): string {
  const done = environmentDone(answers);
  if (done.has(id)) done.delete(id);
  else done.add(id);
  return [...done].join(',');
}
