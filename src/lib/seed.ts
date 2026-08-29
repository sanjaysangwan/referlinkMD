import type {
  AlertLog,
  AlertPreferences,
  Organization,
  Patient,
  Referral,
  ReferralStatus,
  Store,
  Urgency,
  User,
} from "./types";

const PASSWORD_HASH =
  "$2b$10$ClOqienb6Ej4uW4JJKnfb.lP4Azpm0m4stV34HdCJ/X1H3/DuY/Ba";

function iso(date: Date) {
  return date.toISOString();
}

function daysAgo(days: number, hour = 10) {
  const d = new Date();
  d.setHours(hour, 12, 0, 0);
  d.setDate(d.getDate() - days);
  return d;
}

export function createSeed(): Store {
  const organizations: Organization[] = [
    {
      id: "org_riverside",
      name: "Riverside Family Medicine",
      type: "PCP",
      city: "Stillwater",
      phone: "+15552001001",
    },
    {
      id: "org_oakpine",
      name: "Oak & Pine Internal Medicine",
      type: "PCP",
      city: "Harborview",
      phone: "+15552001002",
    },
    {
      id: "org_summit",
      name: "Summit Cardiology",
      type: "SPECIALIST",
      specialty: "Cardiology",
      city: "Stillwater",
      phone: "+15553002001",
    },
    {
      id: "org_clearwater",
      name: "Clearwater Orthopedics",
      type: "SPECIALIST",
      specialty: "Orthopedics",
      city: "Cedar Falls",
      phone: "+15553002002",
    },
    {
      id: "org_northshore",
      name: "Northshore Gastroenterology",
      type: "SPECIALIST",
      specialty: "Gastroenterology",
      city: "Harborview",
      phone: "+15553002003",
    },
    {
      id: "org_lakeside",
      name: "Lakeside Dermatology",
      type: "SPECIALIST",
      specialty: "Dermatology",
      city: "Stillwater",
      phone: "+15553002004",
    },
    {
      id: "org_apex",
      name: "Apex Neurology",
      type: "SPECIALIST",
      specialty: "Neurology",
      city: "Riverbend",
      phone: "+15553002005",
    },
  ];

  const users: User[] = [
    {
      id: "user_elena",
      email: "elena.vasquez@riverside.health",
      passwordHash: PASSWORD_HASH,
      name: "Elena Vasquez",
      credentials: "MD",
      role: "MD",
      organizationId: "org_riverside",
      phone: "+15551110001",
    },
    {
      id: "user_jordan",
      email: "jordan.hale@riverside.health",
      passwordHash: PASSWORD_HASH,
      name: "Jordan Hale",
      credentials: "PA-C",
      role: "MIDLEVEL",
      organizationId: "org_riverside",
      phone: "+15551110002",
    },
    {
      id: "user_priya",
      email: "priya.shah@riverside.health",
      passwordHash: PASSWORD_HASH,
      name: "Priya Shah",
      credentials: "CMPE",
      role: "OFFICE_MANAGER",
      organizationId: "org_riverside",
      phone: "+15551110003",
    },
    {
      id: "user_marcus",
      email: "marcus.chen@riverside.health",
      passwordHash: PASSWORD_HASH,
      name: "Marcus Chen",
      credentials: "CMA",
      role: "STAFF",
      organizationId: "org_riverside",
      phone: "+15551110004",
    },
    {
      id: "user_nathan",
      email: "nathan.cole@summitcardio.health",
      passwordHash: PASSWORD_HASH,
      name: "Nathan Cole",
      credentials: "MD",
      role: "MD",
      organizationId: "org_summit",
      phone: "+15552220001",
    },
    {
      id: "user_avery",
      email: "avery.kim@summitcardio.health",
      passwordHash: PASSWORD_HASH,
      name: "Avery Kim",
      credentials: "NP",
      role: "MIDLEVEL",
      organizationId: "org_summit",
      phone: "+15552220002",
    },
    {
      id: "user_sam",
      email: "sam.ortiz@summitcardio.health",
      passwordHash: PASSWORD_HASH,
      name: "Sam Ortiz",
      credentials: "CMPE",
      role: "OFFICE_MANAGER",
      organizationId: "org_summit",
      phone: "+15552220003",
    },
    {
      id: "user_riley",
      email: "riley.brooks@summitcardio.health",
      passwordHash: PASSWORD_HASH,
      name: "Riley Brooks",
      credentials: "CSR",
      role: "STAFF",
      organizationId: "org_summit",
      phone: "+15552220004",
    },
    {
      id: "user_oak_md",
      email: "helen.cho@oakpine.health",
      passwordHash: PASSWORD_HASH,
      name: "Helen Cho",
      credentials: "MD",
      role: "MD",
      organizationId: "org_oakpine",
      phone: "+15553330001",
    },
  ];

  const alertPreferences: AlertPreferences[] = [
    { userId: "user_elena", smsEnabled: true, voiceEnabled: false, afterHoursVoice: false },
    { userId: "user_jordan", smsEnabled: true, voiceEnabled: false, afterHoursVoice: false },
    { userId: "user_priya", smsEnabled: true, voiceEnabled: true, afterHoursVoice: true },
    { userId: "user_marcus", smsEnabled: false, voiceEnabled: false, afterHoursVoice: false },
    { userId: "user_nathan", smsEnabled: true, voiceEnabled: true, afterHoursVoice: true },
    { userId: "user_avery", smsEnabled: true, voiceEnabled: false, afterHoursVoice: false },
    { userId: "user_sam", smsEnabled: true, voiceEnabled: true, afterHoursVoice: true },
    { userId: "user_riley", smsEnabled: false, voiceEnabled: false, afterHoursVoice: false },
  ];

  const patientSeed: Array<Omit<Patient, "id" | "mrn" | "pcpOrganizationId">> = [
    { name: "Amara Lewis", dob: "1968-03-12", sex: "F", pcpUserId: "user_elena", insurance: "Blue Ridge PPO" },
    { name: "Thomas Nguyen", dob: "1959-11-02", sex: "M", pcpUserId: "user_elena", insurance: "Medicare" },
    { name: "Sofia Alvarez", dob: "1977-07-21", sex: "F", pcpUserId: "user_jordan", insurance: "Harbor Mutual" },
    { name: "James Whitaker", dob: "1946-01-09", sex: "M", pcpUserId: "user_elena", insurance: "Medicare" },
    { name: "Priya Raman", dob: "1984-05-30", sex: "F", pcpUserId: "user_jordan", insurance: "Blue Ridge HMO" },
    { name: "Owen Blake", dob: "1971-09-14", sex: "M", pcpUserId: "user_elena", insurance: "Harbor Mutual" },
    { name: "Lila Montgomery", dob: "1955-12-04", sex: "F", pcpUserId: "user_elena", insurance: "Medicare" },
    { name: "Diego Santos", dob: "1990-04-18", sex: "M", pcpUserId: "user_jordan", insurance: "Blue Ridge PPO" },
    { name: "Helen Park", dob: "1963-08-27", sex: "F", pcpUserId: "user_elena", insurance: "Aetna Choice" },
    { name: "Marcus Reed", dob: "1952-02-11", sex: "M", pcpUserId: "user_elena", insurance: "Medicare" },
    { name: "Noor Haddad", dob: "1988-06-08", sex: "F", pcpUserId: "user_jordan", insurance: "Harbor Mutual" },
    { name: "Evelyn Cho", dob: "1949-10-22", sex: "F", pcpUserId: "user_elena", insurance: "Medicare" },
    { name: "Chris Patel", dob: "1974-03-03", sex: "M", pcpUserId: "user_jordan", insurance: "Blue Ridge PPO" },
    { name: "Ruby Ellis", dob: "1966-01-17", sex: "F", pcpUserId: "user_elena", insurance: "Aetna Choice" },
    { name: "Andre Fontaine", dob: "1958-07-05", sex: "M", pcpUserId: "user_elena", insurance: "Medicare" },
  ];

  const patients: Patient[] = patientSeed.map((p, i) => ({
    ...p,
    id: `pat_${String(i + 1).padStart(3, "0")}`,
    mrn: `RFM-${2400 + i}`,
    pcpOrganizationId: "org_riverside",
  }));

  const oakPatients: Patient[] = [
    {
      id: "pat_oak_1",
      mrn: "OPI-1102",
      name: "Geraldine Moss",
      dob: "1944-09-01",
      sex: "F",
      pcpOrganizationId: "org_oakpine",
      pcpUserId: "user_oak_md",
      insurance: "Medicare",
    },
    {
      id: "pat_oak_2",
      mrn: "OPI-1108",
      name: "Victor Lang",
      dob: "1961-12-19",
      sex: "M",
      pcpOrganizationId: "org_oakpine",
      pcpUserId: "user_oak_md",
      insurance: "Harbor Mutual",
    },
    {
      id: "pat_oak_3",
      mrn: "OPI-1114",
      name: "Mina Okonkwo",
      dob: "1979-05-25",
      sex: "F",
      pcpOrganizationId: "org_oakpine",
      pcpUserId: "user_oak_md",
      insurance: "Blue Ridge PPO",
    },
  ];

  const destinations = [
    { orgId: "org_summit", specialty: "Cardiology", weight: 5 },
    { orgId: "org_clearwater", specialty: "Orthopedics", weight: 2 },
    { orgId: "org_northshore", specialty: "Gastroenterology", weight: 2 },
    { orgId: "org_lakeside", specialty: "Dermatology", weight: 1 },
    { orgId: "org_apex", specialty: "Neurology", weight: 1 },
  ];

  const reasons: Record<string, string[]> = {
    Cardiology: [
      "New atrial fibrillation on office ECG",
      "Exertional chest pressure with equivocal stress test",
      "Uncontrolled hypertension with LVH on echo",
      "Syncope with bifascicular block",
      "Heart failure follow-up after recent admission",
    ],
    Orthopedics: [
      "Persistent knee pain after conservative therapy",
      "Rotator cuff weakness with night pain",
      "Hip osteoarthritis limiting ADLs",
    ],
    Gastroenterology: [
      "Iron deficiency anemia, colonoscopy overdue",
      "Chronic GERD not responding to PPI",
      "Abnormal LFTs with fatty liver on ultrasound",
    ],
    Dermatology: [
      "Changing pigmented lesion on the back",
      "Recalcitrant plaque psoriasis",
    ],
    Neurology: [
      "New migraine pattern with visual aura",
      "Peripheral neuropathy workup",
    ],
  };

  const clinical: Record<string, string> = {
    Cardiology:
      "BP 148/92. HR 88 irregular. BMP unremarkable. Echo EF 52% with mild LAE. Patient reports dyspnea on one flight of stairs.",
    Orthopedics:
      "Exam limited ROM, positive impingement. NSAIDs and PT for 8 weeks without durable relief. X-ray mild OA.",
    Gastroenterology:
      "Hgb 10.4, ferritin 18. FIT negative last year. No overt GI bleeding. Family history of colon cancer in father at 68.",
    Dermatology:
      "Asymmetric 7mm lesion with color variation. No prior biopsy. Patient is fair-skinned with occupational sun exposure.",
    Neurology:
      "Neurologic exam non-focal. Headaches 3x/week, photophobia. Trial of amitriptyline not tolerated.",
  };

  const statuses: ReferralStatus[] = [
    "COMPLETED",
    "COMPLETED",
    "SCHEDULED",
    "ACCEPTED",
    "ALERTED",
    "DECLINED",
  ];
  const urgencies: Urgency[] = ["ROUTINE", "ROUTINE", "SOON", "URGENT"];

  const referrals: Referral[] = [];
  const alerts: AlertLog[] = [];
  let seq = 10420;

  function addReferral(opts: {
    daysAgo: number;
    patient: Patient;
    referringUserId: string;
    referringOrganizationId: string;
    destIndex?: number;
    status?: ReferralStatus;
    assigned?: string;
  }) {
    seq += 1;
    const weighted = destinations.flatMap((d, idx) => Array(d.weight).fill(idx));
    const dest =
      destinations[
        opts.destIndex ?? weighted[(seq * 7 + opts.daysAgo) % weighted.length]
      ];
    const created = daysAgo(opts.daysAgo, 8 + (seq % 9));
    const status =
      opts.status ??
      statuses[(seq + opts.daysAgo) % (opts.daysAgo < 4 ? 5 : statuses.length)];
    const urgency = urgencies[seq % urgencies.length];
    const reasonList = reasons[dest.specialty];
    const reason = reasonList[seq % reasonList.length];
    const acceptedAt =
      status === "ACCEPTED" || status === "SCHEDULED" || status === "COMPLETED"
        ? iso(new Date(created.getTime() + 6 * 3600 * 1000))
        : undefined;
    const scheduledAt =
      status === "SCHEDULED" || status === "COMPLETED"
        ? iso(new Date(created.getTime() + 36 * 3600 * 1000))
        : undefined;
    const assigned =
      opts.assigned ??
      (dest.orgId === "org_summit" && (status === "ACCEPTED" || status === "SCHEDULED" || status === "COMPLETED")
        ? seq % 3 === 0
          ? "user_avery"
          : "user_nathan"
        : undefined);

    const referral: Referral = {
      id: `ref_${seq}`,
      displayId: `HB-${seq}`,
      patientId: opts.patient.id,
      referringUserId: opts.referringUserId,
      referringOrganizationId: opts.referringOrganizationId,
      specialistOrganizationId: dest.orgId,
      assignedSpecialistUserId: assigned,
      specialty: dest.specialty,
      reason,
      clinicalSummary: clinical[dest.specialty],
      urgency,
      status: status === "SUBMITTED" ? "ALERTED" : status,
      createdAt: iso(created),
      updatedAt: iso(new Date(created.getTime() + 8 * 3600 * 1000)),
      acceptedAt,
      scheduledAt,
    };
    referrals.push(referral);

    if (dest.orgId === "org_summit" && status !== "DRAFT") {
      const recipients = ["user_nathan", "user_sam", "user_avery"] as const;
      recipients.forEach((rid, i) => {
        const user = users.find((u) => u.id === rid)!;
        const pref = alertPreferences.find((p) => p.userId === rid)!;
        if (pref.smsEnabled) {
          alerts.push({
            id: `alert_${seq}_sms_${i}`,
            referralId: referral.id,
            organizationId: "org_summit",
            recipientUserId: rid,
            channel: "SMS",
            to: user.phone,
            message: `Harbor: New ${urgency.toLowerCase()} ${dest.specialty} referral ${referral.displayId} from ${organizations.find((o) => o.id === opts.referringOrganizationId)?.name}. Open the specialist queue to review.`,
            status: "DELIVERED",
            createdAt: iso(new Date(created.getTime() + 2 * 60 * 1000)),
            provider: "mock",
          });
        }
        if (pref.voiceEnabled && (urgency === "URGENT" || pref.afterHoursVoice)) {
          alerts.push({
            id: `alert_${seq}_voice_${i}`,
            referralId: referral.id,
            organizationId: "org_summit",
            recipientUserId: rid,
            channel: "VOICE",
            to: user.phone,
            message: `Voice alert: new ${urgency.toLowerCase()} referral ${referral.displayId} is in the Summit Cardiology queue.`,
            status: "DELIVERED",
            createdAt: iso(new Date(created.getTime() + 3 * 60 * 1000)),
            provider: "mock",
          });
        }
      });
    }
  }

  // 12 months of Riverside volume, heavier toward Elena.
  // Step by 5 so the clinician split is not locked to multiples of 3.
  for (let day = 5; day <= 350; day += 5) {
    const patient = patients[day % patients.length];
    const clinician = day % 4 === 0 ? "user_jordan" : "user_elena";
    addReferral({
      daysAgo: day,
      patient,
      referringUserId: clinician,
      referringOrganizationId: "org_riverside",
    });
  }

  // Recent queue items so specialist dashboard is alive
  addReferral({
    daysAgo: 0,
    patient: patients[0],
    referringUserId: "user_elena",
    referringOrganizationId: "org_riverside",
    destIndex: 0,
    status: "ALERTED",
  });
  addReferral({
    daysAgo: 1,
    patient: patients[3],
    referringUserId: "user_elena",
    referringOrganizationId: "org_riverside",
    destIndex: 0,
    status: "ALERTED",
  });
  addReferral({
    daysAgo: 2,
    patient: patients[6],
    referringUserId: "user_jordan",
    referringOrganizationId: "org_riverside",
    destIndex: 0,
    status: "ACCEPTED",
    assigned: "user_nathan",
  });

  oakPatients.forEach((p, i) => {
    addReferral({
      daysAgo: 8 + i * 20,
      patient: p,
      referringUserId: "user_oak_md",
      referringOrganizationId: "org_oakpine",
      destIndex: 0,
    });
  });

  return {
    organizations,
    users,
    patients: [...patients, ...oakPatients],
    referrals,
    alerts,
    alertPreferences,
  };
}
