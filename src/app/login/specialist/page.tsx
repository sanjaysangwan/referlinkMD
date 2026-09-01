import { SPECIALIST_MONTHLY_USD, SPECIALIST_TRIAL_MONTHS, specialistBillingEnabled } from "@/lib/billing";
import { PortalFrame } from "../portal-frame";

export default function SpecialistLogin() {
  const copy = specialistBillingEnabled()
    ? `Text and phone alerts land when a PCP sends a patient. ${SPECIALIST_TRIAL_MONTHS} months free for the specialty practice, then $${SPECIALIST_MONTHLY_USD}/month. Primary care never pays.`
    : "Text and phone alerts land when a PCP sends a patient. Specialty practices are free on ReferLinkMD while we grow the network.";

  return (
    <PortalFrame
      portal="specialist"
      kicker="Specialty care"
      title="Know the moment a referral is on its way."
      copy={copy}
    />
  );
}
