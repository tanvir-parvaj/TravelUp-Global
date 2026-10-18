/**
 * Scenario 11: Corporate B2B Automated Quotation Engine
 * Calculates volume tiered discounts, standard 15% NBR VAT, and 5% AIT for official tax filing
 */
exports.generateCorporateQuotation = async (req, res) => {
    try {
        const {
            company_name,
            contact_person,
            email,
            phone,
            destination = 'Sreemangal',
            delegates_count = 25,
            duration_days = 3,
            bus_type = '30_seat_ac_charter',
            rooms_type = 'twin_sharing',
            include_conference_hall = true,
            include_buffet_catering = true
        } = req.body;

        const count = parseInt(delegates_count) || 25;
        const days = parseInt(duration_days) || 3;

        // Base costs
        let busCharterRate = 35000; // 30-seat AC bus for 3 days
        if (count > 30) busCharterRate = 70000; // 2 buses

        const roomCount = Math.ceil(count / 2); // Twin sharing
        const roomNightRate = 4200;
        const totalRoomCost = roomCount * roomNightRate * (days - 1);

        const conferenceHallRate = include_conference_hall ? (15000 * (days - 1)) : 0;
        const cateringPerPersonPerDay = include_buffet_catering ? 1200 : 0;
        const totalCateringCost = count * cateringPerPersonPerDay * days;

        const subtotal = busCharterRate + totalRoomCost + conferenceHallRate + totalCateringCost;

        // Corporate volume discount (5% for 20+, 10% for 50+)
        let discountPercent = 0;
        if (count >= 50) discountPercent = 10;
        else if (count >= 20) discountPercent = 5;

        const discountAmount = Math.round((subtotal * discountPercent) / 100);
        const netBaseAmount = subtotal - discountAmount;

        // Official Bangladesh Tax Compliance:
        // 15% VAT (Mushak-6.3) + 5% Advance Income Tax (AIT)
        const vatAmount = Math.round(netBaseAmount * 0.15);
        const aitAmount = Math.round(netBaseAmount * 0.05);
        const grandTotal = netBaseAmount + vatAmount + aitAmount;
        const perEmployeeCost = Math.round(grandTotal / count);

        const quotationRef = 'CORP-' + Date.now().toString(36).toUpperCase() + '-' + count;

        return res.json({
            success: true,
            quotation_ref: quotationRef,
            generated_at: new Date().toISOString(),
            company: {
                name: company_name || 'Tech Innovators Bangladesh Ltd.',
                contact_person: contact_person || 'HR Director',
                email: email || 'corporate@techinnovators.bd',
                phone: phone || '+880 1819-000000'
            },
            specifications: {
                destination,
                delegates_count: count,
                duration: `${days} Days, ${days - 1} Nights`,
                transport: bus_type === '30_seat_ac_charter' ? 'Dedicated 30-Seat AC Bus Charter' : 'Premium Coaster',
                lodging: `${roomCount} Deluxe Twin-Bed Rooms (${rooms_type})`,
                conference_hall: include_conference_hall ? 'Complimentary Audio-Visual Conference Hall' : 'Not Included',
                catering: include_buffet_catering ? 'Full Board Corporate Buffet (Breakfast, Lunch, Dinner, High-Tea)' : 'Basic'
            },
            financial_breakdown: {
                bus_charter: busCharterRate,
                lodging_rooms: totalRoomCost,
                conference_facility: conferenceHallRate,
                catering: totalCateringCost,
                gross_subtotal: subtotal,
                volume_discount_percent: discountPercent,
                volume_discount_amount: discountAmount,
                net_taxable_base: netBaseAmount,
                nbr_vat_15_percent: vatAmount,
                advance_income_tax_ait_5_percent: aitAmount,
                grand_total_bdt: grandTotal,
                per_employee_cost_bdt: perEmployeeCost
            },
            compliance_notice: 'Official NBR VAT (Mushak-6.3) and AIT tax invoice will be issued upon corporate PO submission. Compliant for corporate tax deduction under Income Tax Act 2023.'
        });
    } catch (error) {
        console.error('Corporate quotation error:', error);
        return res.status(500).json({ success: false, message: 'Failed to generate quotation', error: error.message });
    }
};
