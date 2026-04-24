import { User, Property, ResponsibleParty, Ordinance, EnforcementCase } from '../types/models';

export const CURRENT_USER: User = {
  id: 'user-1',
  name: 'Officer James Martinez',
  email: 'j.martinez@city.gov',
  role: 'Inspector',
  badgeNumber: 'CE-104',
  phone: '(555) 200-1234',
  department: 'Code Enforcement Division',
};

export const ORDINANCES: Ordinance[] = [
  {
    id: 'ord-1',
    sectionNumber: '18-55',
    title: 'Height of Grass and Weeds',
    category: 'Property Maintenance',
    summary: 'Prohibits grass and weeds from exceeding 12 inches in height on any lot or parcel within city limits.',
    fullText: 'Section 18-55. Height of grass and weeds. It shall be unlawful for any person owning, occupying, or in control of any lot or parcel of land within the city to permit grass or weeds on such property to grow to a height exceeding twelve (12) inches. Any grass or weeds growing in excess of twelve (12) inches shall be deemed a public nuisance. The property owner shall have seven (7) days to bring the property into compliance after notice is given.',
  },
  {
    id: 'ord-2',
    sectionNumber: '36-23',
    title: 'Other Accumulations',
    category: 'Nuisance Abatement',
    summary: 'Prohibits the accumulation of refuse, garbage, rubbish, and other debris on property.',
    fullText: 'Section 36-23. Other accumulations. No person shall permit the accumulation, storage, or deposit of refuse, garbage, rubbish, junk, debris, or other materials in an unsightly or unsanitary condition on any property within the city limits. Such accumulations constitute a public nuisance and are subject to immediate abatement. The responsible party shall remove all accumulations within ten (10) days of receipt of notice.',
  },
  {
    id: 'ord-3',
    sectionNumber: '28-388',
    title: 'Junked Vehicles',
    category: 'Vehicles',
    summary: 'Prohibits the keeping of junked, inoperable, or abandoned vehicles on residential or public property.',
    fullText: 'Section 28-388. Junked vehicles. It is unlawful to keep, store, or permit to remain on any private residential property or public right-of-way any vehicle that is wrecked, dismantled, partially dismantled, inoperative, abandoned, or in such a dilapidated condition as to be unsafe or pose a health hazard. Such vehicles must be removed or stored in a fully enclosed structure within fifteen (15) days of notice.',
  },
  {
    id: 'ord-4',
    sectionNumber: '10-297',
    title: 'Substandard Buildings or Premises',
    category: 'Building Standards',
    summary: 'Addresses buildings and premises that are unsafe, unsanitary, or structurally deficient.',
    fullText: 'Section 10-297. Substandard buildings or premises. Any building or structure that is unsafe, unsanitary, or not provided with adequate egress, or which constitutes a fire hazard, or is otherwise dangerous to human life, or which in relation to existing use constitutes a hazard to safety or health by reason of inadequate maintenance, dilapidation, obsolescence, or abandonment, is hereby declared to be a substandard building. Such buildings shall be repaired, vacated, or demolished as ordered by the code enforcement officer.',
  },
  {
    id: 'ord-5',
    sectionNumber: '18-53',
    title: 'Stagnant Water',
    category: 'Public Health',
    summary: 'Prohibits the existence of stagnant water or conditions that breed mosquitoes or other insects.',
    fullText: 'Section 18-53. Stagnant water. It shall be unlawful for any property owner to allow or permit the accumulation or existence of stagnant water in pools, ponds, excavations, tires, containers, or any other receptacle on property within the city. Stagnant water constitutes a breeding ground for mosquitoes and other insects and is hereby declared a public health hazard. Property owners shall remedy stagnant water conditions within five (5) days of notice.',
  },
  {
    id: 'ord-6',
    sectionNumber: '34-54',
    title: 'Sign Maintenance',
    category: 'Signs',
    summary: 'Requires all signs to be properly maintained and prohibits deteriorated or hazardous signs.',
    fullText: 'Section 34-54. Sign maintenance. All signs shall be maintained in a state of good repair. Signs that are deteriorated, defaced, broken, faded, or otherwise in disrepair shall constitute a violation of this section. No person shall maintain or allow to exist any sign that is structurally unsound, creates a hazard, or is otherwise in violation of this code. Non-conforming signs shall be repaired or removed within thirty (30) days of notice.',
  },
];

export const PROPERTIES: Property[] = [
  {
    id: 'prop-1',
    address: '1423 Elm Street',
    city: 'Springfield',
    state: 'TX',
    zip: '75001',
    parcelNumber: 'R-2024-001423',
    lotNumber: 'Lot 14, Block 3',
    subdivision: 'Elmwood Heights',
    propertyType: 'Residential',
    zoningCode: 'R-1',
    createdAt: '2024-01-15T10:00:00Z',
  },
  {
    id: 'prop-2',
    address: '287 Oak Avenue',
    city: 'Springfield',
    state: 'TX',
    zip: '75001',
    parcelNumber: 'R-2024-000287',
    lotNumber: 'Lot 7, Block 1',
    subdivision: 'Oak Park',
    propertyType: 'Residential',
    zoningCode: 'R-2',
    createdAt: '2024-02-20T09:00:00Z',
  },
  {
    id: 'prop-3',
    address: '560 Industrial Blvd',
    city: 'Springfield',
    state: 'TX',
    zip: '75002',
    parcelNumber: 'C-2024-000560',
    lotNumber: 'Lot 2, Block A',
    propertyType: 'Commercial',
    zoningCode: 'C-2',
    createdAt: '2024-03-10T08:30:00Z',
  },
  {
    id: 'prop-4',
    address: '44 Maple Drive',
    city: 'Springfield',
    state: 'TX',
    zip: '75001',
    parcelNumber: 'R-2024-000044',
    lotNumber: 'Lot 3, Block 9',
    subdivision: 'Maple Ridge',
    propertyType: 'Residential',
    zoningCode: 'R-1',
    createdAt: '2024-04-05T11:00:00Z',
  },
];

export const RESPONSIBLE_PARTIES: ResponsibleParty[] = [
  {
    id: 'rp-1',
    name: 'Robert Nguyen',
    phone: '(555) 312-4567',
    email: 'r.nguyen@email.com',
    address: '1423 Elm Street',
    city: 'Springfield',
    state: 'TX',
    zip: '75001',
    relationship: 'Property Owner',
  },
  {
    id: 'rp-2',
    name: 'Maria Delgado',
    phone: '(555) 223-8901',
    email: 'mdelgado@gmail.com',
    address: '12 Sunset Ln',
    city: 'Arlington',
    state: 'TX',
    zip: '76001',
    relationship: 'Property Owner',
  },
  {
    id: 'rp-3',
    name: 'Industrial Holdings LLC',
    phone: '(555) 400-7000',
    email: 'compliance@indholdings.com',
    address: '900 Commerce Way',
    city: 'Dallas',
    state: 'TX',
    zip: '75201',
    relationship: 'Property Owner',
  },
  {
    id: 'rp-4',
    name: 'Thomas Whitfield',
    phone: '(555) 671-2233',
    email: 'twhitfield@email.com',
    address: '44 Maple Drive',
    city: 'Springfield',
    state: 'TX',
    zip: '75001',
    relationship: 'Property Owner',
  },
];

const now = new Date();
const daysAgo = (d: number) => new Date(now.getTime() - d * 86400000).toISOString();
const daysFromNow = (d: number) => new Date(now.getTime() + d * 86400000).toISOString();
const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

export const CASES: EnforcementCase[] = [
  {
    id: 'case-1',
    caseNumber: 'CE-2026-0001',
    openedDate: daysAgo(30),
    status: 'Open',
    municipalityId: 'springfield-tx',
    propertyId: 'prop-1',
    responsiblePartyId: 'rp-1',
    inspectorId: 'user-1',
    violations: [
      {
        id: 'viol-1',
        caseId: 'case-1',
        ordinanceId: 'ord-1',
        ordinanceSectionNumber: '18-55',
        violationTitle: 'Excessive Grass/Weeds',
        violationDescription: 'Grass and weeds throughout front and back yard are estimated at 18–24 inches in height, well exceeding the 12-inch limit.',
        complianceDeadline: daysFromNow(7),
        noticeStage: 'First Notice',
        inspectorNotes: 'Property appeared vacant. Posted notice on door.',
      },
    ],
    notes: [
      {
        id: 'note-1',
        caseId: 'case-1',
        text: 'Initial inspection completed. Photographed violations. No contact with property owner.',
        createdAt: daysAgo(30),
        authorName: 'Officer James Martinez',
      },
    ],
    attachments: [],
    notices: [
      {
        id: 'notice-1',
        caseId: 'case-1',
        stage: 'First Notice',
        createdAt: daysAgo(28),
        dueDate: daysFromNow(7),
        violationIds: ['viol-1'],
        content: `Date: ${fmtDate(daysAgo(28))}
Case No.: CE-2026-0001

To: Robert Nguyen
Re: 1423 Elm Street, Springfield, TX 75001

Dear Robert Nguyen,

This notice is to inform you that upon inspection of the above-referenced property, the following code violation(s) have been identified:

1. VIOLATION: Excessive Grass/Weeds
   Ordinance Reference: Section 18-55
   Description: Grass and weeds throughout front and back yard are estimated at 18–24 inches in height, well exceeding the 12-inch limit.

You are hereby required to correct ALL violations listed above no later than:

    ${fmtDate(daysFromNow(7))}

Failure to correct the violations within the time allowed may result in further enforcement action, including escalating fines, penalties, and/or abatement at the property owner's expense.

If you have questions or wish to discuss compliance options, please contact:

    Code Enforcement Division
    (555) 200-1000  |  City Hall, 100 Government Plaza, Springfield, TX 75001

Respectfully,

Officer James Martinez
Inspector, Code Enforcement Division
Badge No. CE-104
Phone: (555) 200-1234  |  Email: j.martinez@city.gov`,
      },
    ],
    statusHistory: [
      { status: 'Open', date: daysAgo(30) },
    ],
  },
  {
    id: 'case-2',
    caseNumber: 'CE-2026-0002',
    openedDate: daysAgo(20),
    status: 'Notice Sent',
    municipalityId: 'springfield-tx',
    propertyId: 'prop-2',
    responsiblePartyId: 'rp-2',
    inspectorId: 'user-1',
    violations: [
      {
        id: 'viol-2',
        caseId: 'case-2',
        ordinanceId: 'ord-2',
        ordinanceSectionNumber: '36-23',
        violationTitle: 'Debris Accumulation',
        violationDescription: 'Multiple piles of construction debris, old furniture, and household trash accumulated in the backyard.',
        complianceDeadline: daysFromNow(3),
        noticeStage: 'Second Notice',
        inspectorNotes: 'First notice sent 15 days ago. No compliance observed.',
      },
      {
        id: 'viol-3',
        caseId: 'case-2',
        ordinanceId: 'ord-3',
        ordinanceSectionNumber: '28-388',
        violationTitle: 'Junked Vehicle',
        violationDescription: 'One inoperable vehicle (no tires, no engine cover, heavy rust) parked in driveway.',
        complianceDeadline: daysFromNow(3),
        noticeStage: 'Second Notice',
      },
    ],
    notes: [
      {
        id: 'note-2',
        caseId: 'case-2',
        text: 'Spoke to property owner by phone. She acknowledged the issues and requested additional time.',
        createdAt: daysAgo(14),
        authorName: 'Officer James Martinez',
      },
    ],
    attachments: [],
    notices: [
      {
        id: 'notice-2',
        caseId: 'case-2',
        stage: 'First Notice',
        createdAt: daysAgo(18),
        sentAt: daysAgo(18),
        dueDate: daysAgo(3),
        violationIds: ['viol-2', 'viol-3'],
        content: `Date: ${fmtDate(daysAgo(18))}
Case No.: CE-2026-0002

To: Maria Delgado
Re: 287 Oak Avenue, Springfield, TX 75001

Dear Maria Delgado,

This notice is to inform you that upon inspection of the above-referenced property, the following code violation(s) have been identified:

1. VIOLATION: Debris Accumulation
   Ordinance Reference: Section 36-23
   Description: Multiple piles of construction debris, old furniture, and household trash accumulated in the backyard.

2. VIOLATION: Junked Vehicle
   Ordinance Reference: Section 28-388
   Description: One inoperable vehicle (no tires, no engine cover, heavy rust) parked in driveway.

You are hereby required to correct ALL violations listed above no later than:

    ${fmtDate(daysAgo(3))}

Failure to correct the violations within the time allowed may result in further enforcement action, including escalating fines, penalties, and/or abatement at the property owner's expense.

If you have questions or wish to discuss compliance options, please contact:

    Code Enforcement Division
    (555) 200-1000  |  City Hall, 100 Government Plaza, Springfield, TX 75001

Respectfully,

Officer James Martinez
Inspector, Code Enforcement Division
Badge No. CE-104
Phone: (555) 200-1234  |  Email: j.martinez@city.gov`,
      },
      {
        id: 'notice-3',
        caseId: 'case-2',
        stage: 'Second Notice',
        createdAt: daysAgo(2),
        dueDate: daysFromNow(3),
        violationIds: ['viol-2', 'viol-3'],
        content: `Date: ${fmtDate(daysAgo(2))}
Case No.: CE-2026-0002

To: Maria Delgado
Re: 287 Oak Avenue, Springfield, TX 75001

Dear Maria Delgado,

This is a SECOND NOTICE. Our records indicate that the violations cited below have not been corrected as required by our previous notice. Immediate action is required:

1. VIOLATION: Debris Accumulation
   Ordinance Reference: Section 36-23
   Description: Multiple piles of construction debris, old furniture, and household trash accumulated in the backyard.

2. VIOLATION: Junked Vehicle
   Ordinance Reference: Section 28-388
   Description: One inoperable vehicle (no tires, no engine cover, heavy rust) parked in driveway.

You are hereby required to correct ALL violations listed above no later than:

    ${fmtDate(daysFromNow(3))}

Failure to correct the violations within the time allowed may result in further enforcement action, including escalating fines, penalties, and/or abatement at the property owner's expense.

If you have questions or wish to discuss compliance options, please contact:

    Code Enforcement Division
    (555) 200-1000  |  City Hall, 100 Government Plaza, Springfield, TX 75001

Respectfully,

Officer James Martinez
Inspector, Code Enforcement Division
Badge No. CE-104
Phone: (555) 200-1234  |  Email: j.martinez@city.gov`,
      },
    ],
    statusHistory: [
      { status: 'Open', date: daysAgo(20) },
      { status: 'Notice Sent', date: daysAgo(18) },
    ],
  },
  {
    id: 'case-3',
    caseNumber: 'CE-2026-0003',
    openedDate: daysAgo(45),
    status: 'Pending',
    municipalityId: 'springfield-tx',
    propertyId: 'prop-3',
    responsiblePartyId: 'rp-3',
    inspectorId: 'user-1',
    violations: [
      {
        id: 'viol-4',
        caseId: 'case-3',
        ordinanceId: 'ord-4',
        ordinanceSectionNumber: '10-297',
        violationTitle: 'Substandard Structure',
        violationDescription: 'Exterior walls show significant structural cracking. Roof partially collapsed in rear section. Building appears abandoned.',
        complianceDeadline: daysFromNow(30),
        noticeStage: 'First Notice',
      },
    ],
    notes: [
      {
        id: 'note-3',
        caseId: 'case-3',
        text: 'Contacted LLC representative. They claim to be in process of selling property. Will monitor.',
        createdAt: daysAgo(40),
        authorName: 'Officer James Martinez',
      },
    ],
    attachments: [],
    notices: [],
    statusHistory: [
      { status: 'Open', date: daysAgo(45) },
      { status: 'Pending', date: daysAgo(35) },
    ],
  },
  {
    id: 'case-4',
    caseNumber: 'CE-2026-0004',
    openedDate: daysAgo(60),
    status: 'Closed',
    municipalityId: 'springfield-tx',
    propertyId: 'prop-4',
    responsiblePartyId: 'rp-4',
    inspectorId: 'user-1',
    violations: [
      {
        id: 'viol-5',
        caseId: 'case-4',
        ordinanceId: 'ord-5',
        ordinanceSectionNumber: '18-53',
        violationTitle: 'Stagnant Water',
        violationDescription: 'Multiple containers and a low area in yard retaining stagnant water. Mosquito breeding observed.',
        complianceDeadline: daysAgo(40),
        noticeStage: 'First Notice',
      },
    ],
    notes: [
      {
        id: 'note-4',
        caseId: 'case-4',
        text: 'Reinspection confirmed all violations corrected. Property owner cleared all containers and filled low area.',
        createdAt: daysAgo(45),
        authorName: 'Officer James Martinez',
      },
    ],
    attachments: [],
    notices: [],
    statusHistory: [
      { status: 'Open', date: daysAgo(60) },
      { status: 'Notice Sent', date: daysAgo(55) },
      { status: 'Closed', date: daysAgo(45) },
    ],
    closedDate: daysAgo(45),
  },
];
