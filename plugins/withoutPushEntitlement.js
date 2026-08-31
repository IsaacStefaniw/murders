/**
 * Strip the remote-push entitlement that expo-notifications adds by default.
 *
 * INTENT schedules LOCAL notifications only — a time computed on the device
 * from the person's own logged pattern. Local scheduling needs the user's
 * permission and nothing else: no APNs, no push certificate, no
 * `aps-environment`, no Push Notifications capability on the App ID.
 *
 * Leaving the entitlement in place cost a build. The existing provisioning
 * profile predates notifications, so Xcode refused it outright:
 *
 *   Provisioning profile ... doesn't include the aps-environment entitlement
 *
 * The alternative fix — enabling Push Notifications on the Apple App ID and
 * regenerating the profile — would have worked, and would have left the app
 * claiming a capability it never exercises. App Review is entitled to ask
 * why an app requests push and never registers for it, and the honest
 * answer is that it should not have.
 *
 * If real server-sent push is ever added, delete this plugin and regenerate
 * the provisioning profile with the capability enabled.
 *
 * ORDER MATTERS, counter-intuitively. Expo composes mods so the
 * last-registered runs FIRST, so this must sit BEFORE expo-notifications in
 * the plugins array to run after it. Registered after it, this runs before
 * the entitlement exists and deletes nothing.
 */
const { withEntitlementsPlist } = require('expo/config-plugins');

module.exports = function withoutPushEntitlement(config) {
  // expo-notifications sets this on the STATIC config as well as through the
  // entitlements mod, and the mod seeds itself from the static value — so
  // removing it in one place only puts it straight back.
  if (config.ios && config.ios.entitlements) {
    delete config.ios.entitlements['aps-environment'];
  }
  return withEntitlementsPlist(config, (cfg) => {
    delete cfg.modResults['aps-environment'];
    return cfg;
  });
};
