# TODO.md
# John Ashley
# 29-Sep-2026

# List of requirements - no particular order - for review, triage, design and (once approved) build


REQ1 - As a user, I need the ability to label a case/session/configuration with an Asset ID. Later, I will use this for integration purposes. The field is in the settings page and accepts VARCHAR(255). The Asset ID will form part of the file name when the settings are saved for the pole.

REQ2 - The system has a global toggle METRIC | IMPERIAL, and once selected, ALL values are translated into their equivalent measurment units in appropriate orders of magnitude for the electricity distribution industry (kN, MPA, psi/kpsi, lbf (or whatever the equivalent correct value for bending moment in poles - ton something?, m <-> ft in))

REQ3 - The system will have a Country selector, and each country will have a config file that relates to relevant settings, including: Pole Species, Units (Metric for NZ, Imperial for USA, etc.), Pole Classes by market/country, Pole Embedment Heuristic (differs for NZ and US for example) 1/6th of pole length rule vs. US rule: 10% of pole height + 2 ft; Applicable standards (NZ and AUS: AS/NZS 7000; US ANSI O5.1 and RUS bulletins, etc.)

REQ3 - The system will include the notion of Pole Class. This will refer to the country-specific standards for each species (e.g. ANSI O5.1) and will do the following:
i) when a user taps on a pole class shortcut button, the representative pole dimensions for that species and class will be populated (length, butt dia, GL dia, tip dia) using the lowest value in the class range.
ii) if a user manually enters dimensions and a species, the system will do a lookup against the tables and match to the appropriate range (e.g. Class 4/40 for a Class 4 pole that measures 40' long (or ~35' AGL) based on GL circumference or diameter)

REQ5 - The system name will be changed to Pole Insights throughout

REQ6 - The point at which the load at the tip is applied can be configured (entered as a distance or dragged (carefully - one-time adjustment, don't want it too easy to accidentally shift this)) - the position is used to simulate a load pull in a pole-breaking rig (e.g. attached 300mm below the tip). Forces and loads adjusted accordingly throughout the model taking this point of load into account.

REQ7 - A setting will hide the "Detect" tab so that there is no reference to UB1000 in the UI

REQ8 - The entire site can be hosted (e.g. at poleinsights.digitalartisans.co.nz or poleinsights.innerviewinsights.com) and is protected by a CloudFlare OTP - where we can maintain a list of specific users granted access and/or control a user sign-up based on email address pattern matching (e.g., anyone with @linesmarts.com or @innerviewtech.com or @innerviewinsights.com can access without challenge; but random email addresses require a code or similar to be provided by InnerView Insights)

REQ9 - Detect feature - the UB1000 probes must be able to be moved below ground (negative height value) to simulate a pole yard test where the pole is no longer embedded, or in the case where the inspector has excavated around the pole to apply the probes (e.g. 300 mm below GL)

REQ10 - Defect type - Chipping - A new type of Inspection Defect is added. Chipping is the process of removing decayed shell timber. The settings for this are: Position of Chipping, Height of chipping, Degrees of chipping (0-360 around the pole), depth (reduction of circumference), number of facets (0 = round, minimum of 6 for hexagon shape, 8 for octagon, etc. as this will affect the Finite element analysis for the pole strength) 

REQ11 - Inspection Drilling - When the user adds a new inspection drilling defect, record and model the angle from horizontal (0 is level / horizontal, 45 is angled from the edge downwards to the base and centre of the pole and a 45 degree angle. The effect of the hole needs to be reflected in FEA modelling and start to take affect when the zone is selected that intersects with any part of the drill bore hole)

REQ12 - Have a configurable "Break capacity" setting for the pole. Inisitally, default to 200% of capacity.  At this point, similar a fracture across the pole at the critical area - be creative - have some dramatic snap animation that results in two pieces of pole.  Note; this needs to be configurable as we don't know the actual break force in some cases.

REQ13 - Pole pole post mortem insights, have the ability to enter "Actual break height" and "Actual break force (in the relevant units, e.g. kN).  When simulating load on this pole, show the break happening at the height and load in was recorded at. This will be used to demonstrate individual break cases following pole break trials, or in the case of a pole diagnostic following a storm event, etc.

