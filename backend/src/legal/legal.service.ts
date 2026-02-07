import { Injectable } from '@nestjs/common';

@Injectable()
export class LegalService {
    /**
     * Generates a Section 65B Compliance Certificate (Indian Evidence Act, 1872)
     * This is required for digital records to be admissible as evidence in Indian courts.
     */
    generateSection65BStatement(userName: string, documentId: string, timestamp: Date): string {
        return `
CERTIFICATE UNDER SECTION 65B OF THE INDIAN EVIDENCE ACT, 1872
FOR ADMISSIBILITY OF ELECTRONIC RECORDS

I, ${userName}, do hereby solemnly affirm and state as follows:

1. I am a registered user of the RentLedger platform and the owner/custodian of the computer system/account from which the attached record (ID: ${documentId}) was generated.
2. The electronic record was produced by a computer system that has been used regularly to store or process information for the purposes of activities regularly carried on over that period.
3. Throughout the said period, information of the kind contained in the electronic record was regularly fed into the computer in the ordinary course of the said activities.
4. Throughout the material part of the said period, the computer was operating properly or, if not, that any period in which it was not operating properly or was out of operation during that part of the period was not such as to affect the electronic record or the accuracy of its contents.
5. The information contained in the electronic record reproduces or is derived from information fed into the computer in the ordinary course of the said activities.

Certified by: ${userName}
Date: ${timestamp.toLocaleDateString('en-IN')}
System: RentLedger (Immutable Ledger)
        `.trim();
    }

    getTermsOfService(): string {
        return "RentLedger Terms of Service - Standard Enterprise Rental Agreement...";
    }

    getPrivacyPolicy(): string {
        return "RentLedger Privacy Policy - GDPR & IT Act (India) Compliant...";
    }
}
