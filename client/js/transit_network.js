/**
 * TravelUp Global - Universal All-Bangladesh Multimodal Transit Engine
 * Supports 495 Upazilas, 64 Districts, 8 Divisions, and 375 Tourist Destinations.
 * Features:
 * 1. Intelligent Hub-and-Spoke Route Solver (Feeder -> Trunk Highway/Rail/Flight -> Last-Mile / Mountain)
 * 2. Curated 3-Tier Recommendations: Lowest Price (Budget), Best Value (Recommended), Fastest / Luxury
 * 3. Sequential Time-Window Filtering & Safe Layover Buffers
 * 4. Realistic Bangladesh Fleet Inventory (Bus, Train, Flight, Chander Gari 4WD, HiAce, CNG, Sedan)
 */

(function (window) {
    'use strict';

    // -------------------------------------------------------------
    // 1. Regional Hubs Topology Matrix
    // Maps each division/district to its primary transit hubs
    // -------------------------------------------------------------
    const REGIONAL_HUBS = {
        'BD-DIV-06': { id: 'HUB-DHK', name: 'Dhaka Central Hub', terminal: 'Gabtoli / Sayedabad / Airport', division: 'Dhaka' },
        'BD-DIV-01': { id: 'HUB-CTG', name: 'Chattogram Central Hub', terminal: 'GEC Circle / Dampara / Station', division: 'Chattogram' },
        'BD-DIV-07': { id: 'HUB-RNG', name: 'Rangpur Central Hub', terminal: 'Kamarpara / Modern Mor Terminal', division: 'Rangpur' },
        'BD-DIV-02': { id: 'HUB-RAJ', name: 'Rajshahi / Bogura Hub', terminal: 'Charmatha Bus Terminal / Station', division: 'Rajshahi' },
        'BD-DIV-05': { id: 'HUB-SYL', name: 'Sylhet Central Hub', terminal: 'Kadamtoli / Amberkhana Station', division: 'Sylhet' },
        'BD-DIV-03': { id: 'HUB-KHU', name: 'Khulna Central Hub', terminal: 'Sonadanga Central Terminal', division: 'Khulna' },
        'BD-DIV-04': { id: 'HUB-BAR', name: 'Barishal Central Hub', terminal: 'Nathullabad Terminal / Launch Ghat', division: 'Barishal' },
        'BD-DIV-08': { id: 'HUB-MYM', name: 'Mymensingh Central Hub', terminal: 'Maskanda Terminal', division: 'Mymensingh' }
    };

    // Special Gateway Terminals for Remote / Mountain / Beach destinations
    const SPECIAL_GATEWAYS = {
        'coxsbazar': { name: "Cox's Bazar Beach Gateway", terminal: 'Kolatoli Beach Circle', transitMode: 'tourist_drop' },
        'bandarban': { name: 'Bandarban Hill Gateway', terminal: 'Bandarban Bus Stand', transitMode: 'chander_gari' },
        'thanchi': { name: 'Thanchi Remote Hill Point', terminal: 'Thanchi Chander Gari Stand', transitMode: 'chander_gari' },
        'sajek': { name: 'Sajek Valley Gateway', terminal: 'Khagrachhari / Dighinala Army Convoy', transitMode: 'chander_gari' },
        'sreemangal': { name: 'Sreemangal Tea Zone Gateway', terminal: 'Sreemangal Station / Tea Garden Point', transitMode: 'microbus' },
        'saintmartin': { name: "Saint Martin's Island Gateway", terminal: 'Teknaf Jetty ➔ Cruise Ship Drop', transitMode: 'ship' },
        'kuakata': { name: 'Kuakata Sea Beach Gateway', terminal: 'Kuakata Zero Point Terminal', transitMode: 'tourist_drop' },
        'jaflong': { name: 'Jaflong Riverpoint Gateway', terminal: 'Gowainghat / Jaflong Zero Point', transitMode: 'microbus' },
        'tetulia': { name: 'Tetulia Tea & Himalayan Point', terminal: 'Tetulia Highway Point', transitMode: 'microbus' }
    };

    // -------------------------------------------------------------
    // 2. Realistic Bangladesh Transit Fleets & Operator Schedules
    // -------------------------------------------------------------
    const OPERATOR_FLEET = {
        // Feeder Leg (Upazila -> Hub)
        feeder_local_bus: [
            { id: 'f-bus-01', name: 'Local Highway Express', time: '05:00 PM', arrTime: '06:10 PM', duration: '1h 10m', type: 'Bus', classType: 'Non-AC Economy Chair', price: 80, seats: 40 },
            { id: 'f-bus-02', name: 'Local Highway Express', time: '05:30 PM', arrTime: '06:40 PM', duration: '1h 10m', type: 'Bus', classType: 'Non-AC Economy Chair', price: 80, seats: 40 },
            { id: 'f-bus-03', name: 'Local Highway Express', time: '06:15 PM', arrTime: '07:25 PM', duration: '1h 10m', type: 'Bus', classType: 'Non-AC Economy Chair', price: 80, seats: 40 }
        ],
        feeder_shuttle_hiace: [
            { id: 'f-hiace-01', name: 'AC Regional Shared HiAce', time: '05:15 PM', arrTime: '06:15 PM', duration: '1h 00m', type: 'HiAce', classType: 'Chilled AC Micro', price: 150, seats: 12 },
            { id: 'f-hiace-02', name: 'AC Regional Shared HiAce', time: '05:45 PM', arrTime: '06:45 PM', duration: '1h 00m', type: 'HiAce', classType: 'Chilled AC Micro', price: 150, seats: 12 },
            { id: 'f-hiace-03', name: 'AC Regional Shared HiAce', time: '06:30 PM', arrTime: '07:30 PM', duration: '1h 00m', type: 'HiAce', classType: 'Chilled AC Micro', price: 150, seats: 12 }
        ],
        feeder_cng_auto: [
            { id: 'f-cng-01', name: 'Green CNG 4-Stroke Auto', time: 'On-Demand (05:00 PM - 07:00 PM)', arrTime: '45 mins trip', duration: '45m', type: 'CNG', classType: 'Private 4-Seater Auto', price: 350, seats: 4 }
        ],
        feeder_sedan_taxi: [
            { id: 'f-sedan-01', name: 'Private AC Sedan Cab (Axio / Allion)', time: 'On-Demand Instant', arrTime: '45 mins direct', duration: '45m', type: 'Sedan', classType: 'Private Doorstep Chauffeur', price: 900, seats: 4 }
        ],

        // Trunk Line (Intercity Hub -> Destination Gateway)
        trunk_coaches: [
            { id: 't-coach-01', operator: 'Ena Transport', name: 'Ena AC Luxury Sleeper', time: '07:30 PM', arrTime: '05:15 AM', duration: '9h 45m', type: 'Coach', classType: 'Double-Decker Soft Sleeper Bed', price: 1650, seats: 32, rating: 4.8 },
            { id: 't-coach-02', operator: 'Nabil Paribahan', name: 'Nabil Business Class Scania', time: '09:00 PM', arrTime: '06:30 AM', duration: '9h 30m', type: 'Coach', classType: 'Scania Multi-Axle AC Chair', price: 1400, seats: 36, rating: 4.7 },
            { id: 't-coach-03', operator: 'Hanif Enterprise', name: 'Hanif Volvo 9400 B11R', time: '10:30 PM', arrTime: '07:45 AM', duration: '9h 15m', type: 'Coach', classType: 'VIP 2x1 Recliner AC', price: 1500, seats: 30, rating: 4.6 },
            { id: 't-coach-04', operator: 'Shyamoli NR Travels', name: 'Shyamoli Economy Highway Bus', time: '07:45 PM', arrTime: '05:45 AM', duration: '10h 00m', type: 'Bus', classType: 'Non-AC Hino 1J Chair Coach', price: 850, seats: 40, rating: 4.5 }
        ],
        trunk_trains: [
            { id: 't-train-01', operator: 'Bangladesh Railway', name: 'Intercity Express (Shovon Chair)', time: '08:00 PM', arrTime: '05:30 AM', duration: '9h 30m', type: 'Train', classType: 'Non-AC Reserved Chair', price: 480, seats: 60, rating: 4.3 },
            { id: 't-train-02', operator: 'Bangladesh Railway', name: 'Intercity Express (Snigdha AC)', time: '08:00 PM', arrTime: '05:30 AM', duration: '9h 30m', type: 'Train', classType: 'Snigdha Chilled AC Chair', price: 950, seats: 45, rating: 4.7 }
        ],
        trunk_flights: [
            { id: 't-air-01', operator: 'Biman Bangladesh Airlines', name: 'Domestic Jet (DAC ➔ CXB / CGP)', time: '09:45 AM', arrTime: '10:45 AM', duration: '1h 00m', type: 'Flight', classType: 'Boeing 737 Economy', price: 3800, seats: 120, rating: 4.9 },
            { id: 't-air-02', operator: 'US-Bangla Airlines', name: 'ATR 72-600 Direct Flight', time: '02:30 PM', arrTime: '03:30 PM', duration: '1h 00m', type: 'Flight', classType: 'ATR 72 Premium Economy', price: 4200, seats: 72, rating: 4.8 }
        ],

        // Last-Mile / Mountain / Beach Access
        last_mile: [
            { id: 'lm-chander-01', name: 'Chander Gari 4WD (Shared Seat)', time: '06:00 AM', arrTime: '09:30 AM', duration: '3h 30m', type: 'Chander Gari', classType: '4WD Mountain Off-Road Jeep', price: 350, seats: 12, terrain: 'hilly' },
            { id: 'lm-chander-02', name: 'Chander Gari 4WD (Full Reserved)', time: '06:30 AM', arrTime: '10:00 AM', duration: '3h 30m', type: 'Chander Gari', classType: 'Reserved 4WD Mountain Jeep', price: 3200, isVehicleTotal: true, seats: 12, terrain: 'hilly' },
            { id: 'lm-tourist-micro', name: 'AC Tourist Microbus Drop', time: '06:00 AM', arrTime: '08:30 AM', duration: '2h 30m', type: 'Microbus', classType: 'Chilled HiAce Direct Drop', price: 450, seats: 11, terrain: 'standard' },
            { id: 'lm-dest-cng', name: 'Local Tourist CNG / Auto', time: 'On-Demand Morning', arrTime: '1 hr direct', duration: '1h 00m', type: 'CNG', classType: 'Direct Beach / Spot Transfer', price: 250, seats: 4, terrain: 'standard' }
        ]
    };

    // -------------------------------------------------------------
    // 3. Smart Hub Solver: Map Any Location to Its Transit Hub
    // -------------------------------------------------------------
    function resolveLocationHub(locationText) {
        if (!locationText) return REGIONAL_HUBS['BD-DIV-06']; // default Dhaka

        const lower = locationText.toLowerCase();

        // Check divisions & districts
        if (lower.includes('rangpur') || lower.includes('pirganj') || lower.includes('dinajpur') || lower.includes('panchagarh') || lower.includes('tetulia') || lower.includes('kurigram') || lower.includes('nilphamari') || lower.includes('gaibandha')) {
            return REGIONAL_HUBS['BD-DIV-07']; // Rangpur Hub
        }
        if (lower.includes('chattogram') || lower.includes('chittagong') || lower.includes('cox') || lower.includes('bandarban') || lower.includes('thanchi') || lower.includes('sajek') || lower.includes('rangamati') || lower.includes('khagrachhari') || lower.includes('teknaf')) {
            return REGIONAL_HUBS['BD-DIV-01']; // Chattogram Hub
        }
        if (lower.includes('sylhet') || lower.includes('sreemangal') || lower.includes('moulvibazar') || lower.includes('habiganj') || lower.includes('sunamganj') || lower.includes('jaflong')) {
            return REGIONAL_HUBS['BD-DIV-05']; // Sylhet Hub
        }
        if (lower.includes('rajshahi') || lower.includes('bogra') || lower.includes('bogura') || lower.includes('naogaon') || lower.includes('pabna') || lower.includes('natore') || lower.includes('sirajganj')) {
            return REGIONAL_HUBS['BD-DIV-02']; // Rajshahi / Bogura Hub
        }
        if (lower.includes('khulna') || lower.includes('jashore') || lower.includes('jessore') || lower.includes('kushtia') || lower.includes('satkhira') || lower.includes('bagerhat') || lower.includes('sundarban')) {
            return REGIONAL_HUBS['BD-DIV-03']; // Khulna Hub
        }
        if (lower.includes('barishal') || lower.includes('barisal') || lower.includes('patuakhali') || lower.includes('kuakata') || lower.includes('bhola') || lower.includes('barguna')) {
            return REGIONAL_HUBS['BD-DIV-04']; // Barishal Hub
        }
        if (lower.includes('mymensingh') || lower.includes('jamalpur') || lower.includes('netrokona') || lower.includes('sherpur')) {
            return REGIONAL_HUBS['BD-DIV-08']; // Mymensingh Hub
        }

        return REGIONAL_HUBS['BD-DIV-06']; // Default: Dhaka Hub
    }

    // Determine special terrain requirements for destination (e.g. Hill Tracts -> Chander Gari)
    function detectDestinationTerrain(destText) {
        if (!destText) return 'standard';
        const lower = destText.toLowerCase();

        if (lower.includes('thanchi') || lower.includes('sajek') || lower.includes('bandarban') || lower.includes('nilgiri') || lower.includes('keokradong') || lower.includes('boga lake') || lower.includes('dighinala') || lower.includes('rangamati') || lower.includes('khagrachhari')) {
            return 'hilly'; // Requires 4WD Chander Gari
        }
        if (lower.includes('saint martin') || lower.includes('st. martin') || lower.includes('chera dwip')) {
            return 'island_ship'; // Requires Sea Truck / Cruise Ship
        }
        if (lower.includes('sundarban') || lower.includes('kotka') || lower.includes('dublar char')) {
            return 'river_boat'; // Requires Boat / Launch
        }
        return 'standard';
    }

    // -------------------------------------------------------------
    // 4. Generate 3 Clean Curated Tiers (Lowest Price, Best Value, Fastest)
    // -------------------------------------------------------------
    // -------------------------------------------------------------
    // Live Admin Transit Fleet Synchronizer & Stoppage Route Solver
    // -------------------------------------------------------------
    function getLiveAdminVehicles() {
        const list = [];
        try {
            if (typeof localStorage !== 'undefined') {
                const raw = localStorage.getItem('travelup_stored_products_map_v1');
                if (raw) {
                    const map = JSON.parse(raw);
                    if (typeof map === 'object' && map !== null) {
                        Object.keys(map).forEach(opName => {
                            const prods = map[opName];
                            if (Array.isArray(prods)) {
                                prods.forEach(p => {
                                    list.push({
                                        ...p,
                                        operator: p.operator || opName
                                    });
                                });
                            }
                        });
                    }
                }
            }
        } catch (e) {
            console.warn('Error reading admin transit products:', e);
        }
        return list;
    }

    function matchVehicleLeg(vehicle, searchFrom, searchTo, filterMode = 'all', targetDestSlug = '') {
        // Filter by mode if specified (bus, train, flight, launch)
        if (filterMode && filterMode !== 'all') {
            const specLower = (vehicle.specs || vehicle.categoryType || '').toLowerCase();
            const nameLower = (vehicle.name || '').toLowerCase();
            const modeLower = filterMode.toLowerCase();
            const matchesMode = specLower.includes(modeLower) || nameLower.includes(modeLower);
            if (!matchesMode) return null;
        }

        const fromLower = (searchFrom || '').toLowerCase().trim();
        const toLower = (searchTo || '').toLowerCase().trim();
        if (!fromLower || !toLower) return null;

        // Build ordered route sequence: origin -> intermediate stoppages -> destination
        const points = [
            { 
                name: vehicle.from || '', 
                upazila: vehicle.originUpazila || '', 
                depTime: vehicle.depTime || '', 
                arrTime: vehicle.depTime || '', 
                stopType: 'Boarding Only' 
            },
            ...(Array.isArray(vehicle.stoppages) ? vehicle.stoppages : []),
            { 
                name: vehicle.to || '', 
                upazila: vehicle.destUpazila || '', 
                depTime: vehicle.arrTime || '', 
                arrTime: vehicle.arrTime || '', 
                stopType: 'Dropping Only' 
            }
        ];

        let fromIdx = -1;
        let toIdx = -1;

        for (let i = 0; i < points.length; i++) {
            const pt = points[i];
            const ptName = (pt.name || '').toLowerCase();
            const ptUpz = (pt.upazila || '').toLowerCase();

            if (fromIdx === -1 && pt.stopType !== 'Dropping Only') {
                if (ptName.includes(fromLower) || fromLower.includes(ptName) || 
                    (ptUpz && (ptUpz.includes(fromLower) || fromLower.includes(ptUpz)))) {
                    fromIdx = i;
                    continue;
                }
            }

            if (fromIdx !== -1 && i > fromIdx && pt.stopType !== 'Boarding Only') {
                if (ptName.includes(toLower) || toLower.includes(ptName) || 
                    (ptUpz && (ptUpz.includes(toLower) || toLower.includes(ptUpz)))) {
                    toIdx = i;
                    break;
                }
            }
        }

        // If matched both endpoints with valid forward direction
        if (fromIdx !== -1 && toIdx !== -1 && toIdx > fromIdx) {
            const fromPt = points[fromIdx];
            const toPt = points[toIdx];
            const isFull = (fromIdx === 0 && toIdx === points.length - 1);

            let fare = parseFloat(vehicle.fare) || 1200;
            // Lookup Stage-Wise Fare
            if (Array.isArray(vehicle.stageFares) && vehicle.stageFares.length > 0) {
                const found = vehicle.stageFares.find(sf => {
                    const sfFrom = (sf.from || '').toLowerCase();
                    const sfTo = (sf.to || '').toLowerCase();
                    const curFrom = fromPt.name.toLowerCase();
                    const curTo = toPt.name.toLowerCase();
                    return (sfFrom.includes(curFrom) || curFrom.includes(sfFrom)) &&
                           (sfTo.includes(curTo) || curTo.includes(sfTo));
                });
                if (found && found.fare) {
                    fare = parseFloat(found.fare);
                } else if (!isFull) {
                    fare = Math.round((vehicle.fare * (toIdx - fromIdx) / Math.max(1, points.length - 1)) / 10) * 10;
                }
            }

            return {
                matched: true,
                id: vehicle.id,
                vehicleName: vehicle.name,
                operator: vehicle.operator,
                regNo: vehicle.regNo || '',
                specs: vehicle.specs || vehicle.categoryType || 'Standard Coach',
                type: (vehicle.specs && vehicle.specs.toLowerCase().includes('train')) ? 'Train' : ((vehicle.specs && vehicle.specs.toLowerCase().includes('flight')) ? 'Flight' : ((vehicle.specs && vehicle.specs.toLowerCase().includes('launch')) ? 'Launch' : 'Bus')),
                boardPoint: fromPt.name,
                boardTime: fromPt.depTime || fromPt.arrTime || vehicle.depTime,
                dropPoint: toPt.name,
                dropTime: toPt.arrTime || toPt.depTime || vehicle.arrTime,
                duration: vehicle.duration || '8h 00m',
                fare,
                isIntermediate: !isFull,
                seatPlan: vehicle.seatPlan || { preset: '2x2-40', totalSeats: 40, availableSeats: 36, seatMap: {} },
                photo: vehicle.photo || '',
                linkedDestination: vehicle.linkedDestination || ''
            };
        }

        return null;
    }

    /**
     * Calculate 3-tier multimodal transit options linking Admin live fleets & intermediate stoppages
     */
    function calculateSmartRouteTiers(originName, destName, travelers = 1, filterMode = 'all', targetDestSlug = '') {
        const originHub = resolveLocationHub(originName);
        const destHub = resolveLocationHub(destName);
        const terrain = detectDestinationTerrain(destName);

        const isDirect = (originHub.id === destHub.id);

        // 1. Check Live Admin Fleet
        const adminVehicles = getLiveAdminVehicles();
        const matchedLiveLegs = [];

        if (adminVehicles.length > 0) {
            adminVehicles.forEach(v => {
                // Try matching: direct endpoints OR regional hubs OR user search query
                const m1 = matchVehicleLeg(v, originName, destName, filterMode, targetDestSlug);
                const m2 = !m1 ? matchVehicleLeg(v, originHub.name, destHub.name, filterMode, targetDestSlug) : null;
                const m3 = (!m1 && !m2) ? matchVehicleLeg(v, originName, destHub.name, filterMode, targetDestSlug) : null;
                const m4 = (!m1 && !m2 && !m3) ? matchVehicleLeg(v, originHub.name, destName, filterMode, targetDestSlug) : null;

                const match = m1 || m2 || m3 || m4;
                if (match) {
                    // Check if linked to target destination
                    let priority = 1;
                    if (targetDestSlug && match.linkedDestination === targetDestSlug) {
                        priority = 10;
                    }
                    matchedLiveLegs.push({ ...match, priority });
                }
            });
        }

        // Sort live matches: priority first, then fare
        matchedLiveLegs.sort((a, b) => (b.priority - a.priority) || (a.fare - b.fare));

        // Default Fleet Fallbacks
        const defaultCoaches = OPERATOR_FLEET.trunk_coaches || [];
        const defaultTrains = OPERATOR_FLEET.trunk_trains || [];
        const defaultFlights = OPERATOR_FLEET.trunk_flights || [];

        // Select Trunk Leg for Tier 1: Lowest Price / Budget
        let bLeg1 = OPERATOR_FLEET.feeder_local_bus[1];
        let bLeg2 = (matchedLiveLegs.length > 0) ? matchedLiveLegs[0] : (filterMode === 'train' ? defaultTrains[0] : (filterMode === 'flight' ? defaultFlights[0] : defaultTrains[0]));
        let bLeg3 = (terrain === 'hilly') ? OPERATOR_FLEET.last_mile[0] : OPERATOR_FLEET.last_mile[3];
        const bTrunkFare = bLeg2.fare || bLeg2.price || 480;
        const budgetTotal = bLeg1.price + bTrunkFare + bLeg3.price;

        // Select Trunk Leg for Tier 2: Best Value / Recommended
        let rLeg1 = OPERATOR_FLEET.feeder_shuttle_hiace[1];
        let rLeg2 = (matchedLiveLegs.length > 1) ? matchedLiveLegs[Math.floor(matchedLiveLegs.length / 2)] : (matchedLiveLegs[0] || defaultCoaches[0]);
        let rLeg3 = (terrain === 'hilly') ? OPERATOR_FLEET.last_mile[0] : OPERATOR_FLEET.last_mile[2];
        const rTrunkFare = rLeg2.fare || rLeg2.price || 1650;
        const recommendedTotal = rLeg1.price + rTrunkFare + rLeg3.price;

        // Select Trunk Leg for Tier 3: Fastest / Luxury
        let lLeg1 = OPERATOR_FLEET.feeder_sedan_taxi[0];
        let lLeg2 = (matchedLiveLegs.length > 0 && matchedLiveLegs[matchedLiveLegs.length - 1].fare >= 1500) 
            ? matchedLiveLegs[matchedLiveLegs.length - 1] 
            : (filterMode === 'flight' ? defaultFlights[0] : defaultCoaches[2]);
        let lLeg3 = (terrain === 'hilly') 
            ? { ...OPERATOR_FLEET.last_mile[1], pricePerPerson: Math.round(OPERATOR_FLEET.last_mile[1].price / Math.max(1, travelers)) }
            : { ...OPERATOR_FLEET.last_mile[2], price: 650 };
        const lTrunkFare = lLeg2.fare || lLeg2.price || 1500;
        const luxuryPerPersonLeg3 = lLeg3.pricePerPerson || lLeg3.price;
        const luxuryTotal = Math.round(lLeg1.price / Math.max(1, travelers)) + lTrunkFare + luxuryPerPersonLeg3;

        // Helper to format trunk leg title
        function formatTrunkLeg(leg, defaultHubs) {
            if (leg.matched) {
                const badge = leg.isIntermediate ? ' [Stoppage Transfer]' : '';
                return {
                    title: `Trunk: ${leg.boardPoint} ➔ ${leg.dropPoint}${badge}`,
                    vehicle: `${leg.operator} - ${leg.vehicleName} (${leg.specs})`,
                    time: `${leg.boardTime} - ${leg.dropTime}`,
                    price: leg.fare,
                    slotKey: 'coach',
                    itemId: leg.id,
                    seatPlan: leg.seatPlan,
                    isLiveAdmin: true,
                    regNo: leg.regNo,
                    operator: leg.operator,
                    isIntermediate: leg.isIntermediate
                };
            }
            return {
                title: `Trunk: ${defaultHubs}`,
                vehicle: `${leg.name} (${leg.classType})`,
                time: `${leg.time} - ${leg.arrTime}`,
                price: leg.price,
                slotKey: (leg.type === 'Train' ? 'train' : (leg.type === 'Flight' ? 'flight' : 'coach')),
                itemId: leg.id || 1
            };
        }

        const trunkDesc = `${originHub.name} ➔ ${destHub.name}`;

        return {
            originHub,
            destHub,
            terrain,
            isDirect,
            liveVehiclesCount: matchedLiveLegs.length,
            budget: {
                key: 'budget',
                label: 'Lowest Price',
                badgeClass: 'badge-budget',
                icon: 'savings',
                color: '#16a34a',
                perPersonPrice: budgetTotal,
                totalPrice: budgetTotal * travelers,
                summaryRoute: `${bLeg1.type} + ${bLeg2.type || 'Bus'} + ${bLeg3.type}`,
                timeEstimate: bLeg2.duration || '16h 30m',
                legs: [
                    { step: 1, title: `Feeder: ${originName} ➔ ${originHub.name}`, vehicle: bLeg1.name, time: `${bLeg1.time} - ${bLeg1.arrTime}`, price: bLeg1.price, slotKey: 'bus', itemId: 1 },
                    { step: 2, ...formatTrunkLeg(bLeg2, trunkDesc) },
                    { step: 3, title: `Access: ${destHub.name} ➔ ${destName}`, vehicle: `${bLeg3.name}`, time: `${bLeg3.time} - ${bLeg3.arrTime}`, price: bLeg3.price, slotKey: (terrain === 'hilly' ? 'jeep' : 'dest_cng'), itemId: 1 }
                ]
            },
            recommended: {
                key: 'recommended',
                label: 'Best Value',
                badgeClass: 'badge-recommended',
                icon: 'verified',
                color: '#0284c7',
                perPersonPrice: recommendedTotal,
                totalPrice: recommendedTotal * travelers,
                summaryRoute: `${rLeg1.type} + ${rLeg2.type || 'Coach'} + ${rLeg3.type}`,
                timeEstimate: rLeg2.duration || '12h 00m',
                legs: [
                    { step: 1, title: `Feeder: ${originName} ➔ ${originHub.name}`, vehicle: rLeg1.name, time: `${rLeg1.time} - ${rLeg1.arrTime}`, price: rLeg1.price, slotKey: 'microbus', itemId: 1 },
                    { step: 2, ...formatTrunkLeg(rLeg2, trunkDesc) },
                    { step: 3, title: `Access: ${destHub.name} ➔ ${destName}`, vehicle: `${rLeg3.name}`, time: `${rLeg3.time} - ${rLeg3.arrTime}`, price: rLeg3.price, slotKey: (terrain === 'hilly' ? 'jeep' : 'dest_micro'), itemId: 1 }
                ]
            },
            luxury: {
                key: 'luxury',
                label: 'Fastest / Luxury',
                badgeClass: 'badge-luxury',
                icon: 'electric_bolt',
                color: '#9333ea',
                perPersonPrice: luxuryTotal,
                totalPrice: luxuryTotal * travelers,
                summaryRoute: `${lLeg1.type} + ${lLeg2.type || 'Coach'} + ${lLeg3.type}`,
                timeEstimate: lLeg2.duration || '09h 30m',
                legs: [
                    { step: 1, title: `Feeder: ${originName} ➔ ${originHub.name}`, vehicle: lLeg1.name, time: `${lLeg1.time}`, price: Math.round(lLeg1.price / Math.max(1, travelers)), slotKey: 'sedan', itemId: 1 },
                    { step: 2, ...formatTrunkLeg(lLeg2, trunkDesc) },
                    { step: 3, title: `Access: ${destHub.name} ➔ ${destName}`, vehicle: `${lLeg3.name}`, time: `${lLeg3.time} - ${lLeg3.arrTime}`, price: luxuryPerPersonLeg3, slotKey: 'jeep', itemId: 2 }
                ]
            }
        };
    }
function parseTimeStringToMinutes(timeStr) {
        if (!timeStr) return 0;
        const match = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
        if (!match) return 0;
        let hours = parseInt(match[1], 10);
        const mins = parseInt(match[2], 10);
        const period = match[3].toUpperCase();

        if (period === 'PM' && hours !== 12) hours += 12;
        if (period === 'AM' && hours === 12) hours = 0;

        return hours * 60 + mins;
    }

    function checkConnectionSafety(prevArrivalTimeStr, nextDepartureTimeStr, minBufferMins = 30) {
        const arrMins = parseTimeStringToMinutes(prevArrivalTimeStr);
        const depMins = parseTimeStringToMinutes(nextDepartureTimeStr);

        // Handle overnight transit (e.g. arr at 11:45 PM, dep at 01:15 AM)
        let diff = depMins - arrMins;
        if (diff < -720) {
            diff += 1440; // overnight next day
        }

        if (diff < 0) {
            return { isValid: false, status: 'departed', label: 'Departed / Cannot catch', diffMins: diff };
        }
        if (diff < minBufferMins) {
            return { isValid: false, status: 'tight', label: `Tight (${diff}m - risk of missing)`, diffMins: diff };
        }
        if (diff <= 120) {
            return { isValid: true, status: 'safe', label: `Safe Layover (${diff}m buffer)`, diffMins: diff };
        }
        return { isValid: true, status: 'long', label: `Long Layover (${Math.floor(diff / 60)}h ${diff % 60}m wait)`, diffMins: diff };
    }

    // Expose engine to global window
    window.TRAVELUP_TRANSIT_NETWORK = {
        REGIONAL_HUBS,
        SPECIAL_GATEWAYS,
        OPERATOR_FLEET,
        resolveLocationHub,
        detectDestinationTerrain,
        calculateSmartRouteTiers,
        parseTimeStringToMinutes,
        checkConnectionSafety
    ,
        getLiveAdminVehicles,
        matchVehicleLeg};

})(window);
