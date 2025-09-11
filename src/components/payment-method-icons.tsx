
'use client';

import React from 'react';
import Image from 'next/image';

const MtnLogo = () => <Image src="https://upload.wikimedia.org/wikipedia/commons/9/93/MTN_Logo.svg" alt="MTN Mobile Money" width={48} height={48} className="object-contain" />;
const VodafoneLogo = () => <Image src="https://upload.wikimedia.org/wikipedia/commons/0/0e/Vodafone_2017_logo.svg" alt="Vodafone Cash" width={48} height={48} className="object-contain" />;
const AirtelTigoLogo = () => <Image src="https://upload.wikimedia.org/wikipedia/commons/6/69/Airtel_Tigo_Logo.svg" alt="AirtelTigo Money" width={80} height={48} className="object-contain" />;

const VisaLogo = () => <Image src="https://upload.wikimedia.org/wikipedia/commons/5/5e/Visa_Inc._logo.svg" alt="Visa" width={60} height={40} className="object-contain" />;
const MastercardLogo = () => <Image src="https://upload.wikimedia.org/wikipedia/commons/a/a4/Mastercard_2019_logo.svg" alt="Mastercard" width={50} height={40} className="object-contain" />;

const GcbLogo = () => <Image src="https://upload.wikimedia.org/wikipedia/en/c/cb/GCB_Bank_logo.png" alt="GCB Bank" width={48} height={48} className="object-contain" />;
const EcobankLogo = () => <Image src="https://upload.wikimedia.org/wikipedia/commons/1/15/Ecobank_logo.svg" alt="Ecobank" width={80} height={48} className="object-contain" />;


export const paymentMethodIcons: Record<string, React.FC> = {
    mtn: MtnLogo,
    vodafone: VodafoneLogo,
    airteltigo: AirtelTigoLogo,
    visa: VisaLogo,
    mastercard: MastercardLogo,
    gcb: GcbLogo,
    ecobank: EcobankLogo,
};

    