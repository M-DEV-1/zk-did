// Demo script showing how external entities can trigger consent requests
// This would be used by third-party applications to request user consent

const BASE_URL = 'http://localhost:3000'; // Update with your actual domain

// Example 1: Voting Booth System requesting DOB and Location
async function requestVotingBoothConsent() {
  const request = {
    walletAddress: "0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6", // User's wallet address
    provider: {
      name: "Voting Booth System",
      description: "We need to verify your eligibility and location for voting purposes.",
      providerId: "voting_booth_001",
      sessionDuration: 60000, // 30 seconds
      category: "Government",
      website: "https://eci.gov.in",
      contact: "support@eci.gov.in"
    },
    // requestedFields -> not required
    // provider -> asks the questiosn -> not related to the VC -> not dynamic as of now
    // provider selects user -> asks predefined questions -> location + dob questions for example 
    // predefined questions + session timers -> no variable questions
    // aadharNo and name | NFT metadata 
    requestedFields: ["dob", "location"], // questions -> is he above 21? is this his location -> solved withzkProof
    callbackUrl: "https://eci.gov.in/voting-callback",
    metadata: {
      electionId: "2024_general",
      boothLocation: "Delhi Central",
      purpose: "voter_verification"
    }
  };

  try {
    const response = await fetch(`${BASE_URL}/api/external-consent-request`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    const data = await response.json();
    console.log('Voting Booth Consent Request:', data);
    return data;
  } catch (error) {
    console.error('Error requesting voting booth consent:', error);
  }
} 
/* 


*/

// Example 2: UPI Payment Gateway requesting Name and Aadhaar ID
async function requestUPIConsent() {
  const request = {
    walletAddress: "0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6",
    provider: {
      name: "UPI Payment Gateway",
      description: "Verify your identity for secure UPI transactions and KYC compliance.",
      providerId: "upi_gateway_001",
      sessionDuration: 30000, // 30 seconds
      category: "Finance",
      website: "https://upi.org.in",
      contact: "support@upi.org.in"
    },
    requestedFields: ["location"], // Valid fields from vcSchema.js
    callbackUrl: "https://upi.org.in/kyc-callback",
    metadata: {
      transactionId: "TXN123456789",
      amount: "5000",
      purpose: "kyc_verification"
    }
  };

  try {
    const response = await fetch(`${BASE_URL}/api/external-consent-request`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    const data = await response.json();
    console.log('UPI Consent Request:', data);
    return data;
  } catch (error) {
    console.error('Error requesting UPI consent:', error);
  }
}

// Example 3: DigiLocker requesting all identity fields
async function requestDigiLockerConsent() {
  const request = {
    walletAddress: "0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6",
    provider: {
      name: "DigiLocker",
      description: "Access your digital documents and certificates securely.",
      providerId: "digilocker_001",
      sessionDuration: 30000, // 30 seconds
      category: "Government",
      website: "https://digilocker.gov.in",
      contact: "support@digilocker.gov.in"
    },
    requestedFields: ["location"], // Valid fields from vcSchema.js
    callbackUrl: "https://digilocker.gov.in/document-access",
    metadata: {
      documentType: "driving_license",
      purpose: "document_verification"
    }
  };

  try {
    const response = await fetch(`${BASE_URL}/api/external-consent-request`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    const data = await response.json();
    console.log('DigiLocker Consent Request:', data);
    return data;
  } catch (error) {
    console.error('Error requesting DigiLocker consent:', error);
  }
}

// Example 4: CoWIN Portal for vaccination verification
async function requestCoWINConsent() {
  const request = {
    walletAddress: "0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6",
    provider: {
      name: "CoWIN Portal",
      description: "Verify vaccination status and schedule appointments.",
      providerId: "cowin_001",
      sessionDuration: 30000, // 30 seconds
      category: "Healthcare",
      website: "https://cowin.gov.in",
      contact: "support@cowin.gov.in"
    },
    requestedFields: ["dob", "location"], // Valid fields from vcSchema.js
    callbackUrl: "https://cowin.gov.in/vaccination-status",
    metadata: {
      vaccineType: "COVID-19",
      doseNumber: "2",
      purpose: "vaccination_verification"
    }
  };

  try {
    const response = await fetch(`${BASE_URL}/api/external-consent-request`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    const data = await response.json();
    console.log('CoWIN Consent Request:', data);
    return data;
  } catch (error) {
    console.error('Error requesting CoWIN consent:', error);
  }
}

// Example 5: Bank KYC Verification
async function requestBankKYCConsent() {
  const request = {
    walletAddress: "0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6",
    provider: {
      name: "State Bank of India",
      description: "Complete your Know Your Customer verification for banking services.",
      providerId: "bank_kyc_001",
      sessionDuration: 30000, // 30 seconds
      category: "Finance",
      website: "https://sbi.co.in",
      contact: "support@sbi.co.in"
    },
    requestedFields: ["dob"], 
    callbackUrl: "https://sbi.co.in/kyc-callback",
    metadata: {
      accountType: "savings",
      branchCode: "DEL001",
      purpose: "kyc_verification"
    }
  };

  try {
    const response = await fetch(`${BASE_URL}/api/external-consent-request`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    const data = await response.json();
    console.log('Bank KYC Consent Request:', data);
    return data;
  } catch (error) {
    console.error('Error requesting bank KYC consent:', error);
  }
}

// Example 6: GST Portal for business verification
async function requestGSTConsent() {
  const request = {
    walletAddress: "0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6",
    provider: {
      name: "GST Portal",
      description: "Business registration and tax filing verification.",
      providerId: "gst_portal_001",
      sessionDuration: 30000, // 30 seconds
      category: "Business",
      website: "https://gst.gov.in",
      contact: "support@gst.gov.in"
    },
    requestedFields: ["dob"], // Valid fields from vcSchema.js
    callbackUrl: "https://gst.gov.in/business-verification",
    metadata: {
      businessType: "proprietorship",
      gstNumber: "07ABCDE1234F1Z5",
      purpose: "business_verification"
    }
  };

  try {
    const response = await fetch(`${BASE_URL}/api/external-consent-request`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    const data = await response.json();
    console.log('GST Portal Consent Request:', data);
    return data;
  } catch (error) {
    console.error('Error requesting GST consent:', error);
  }
}

// Function to check request status
async function checkRequestStatus(requestId) {
  try {
    const response = await fetch(`${BASE_URL}/api/external-consent-request?requestId=${requestId}`);
    const data = await response.json();
    console.log('Request Status:', data);
    return data;
  } catch (error) {
    console.error('Error checking request status:', error);
  }
}

// Example usage
async function runDemo() {
  console.log('=== External Consent Request Demo ===\n');
  console.log('Testing various government and financial services...\n');
  console.log('Using only valid fields from vcSchema.js: aadhaarId, name, dob, location\n');

  // Request 1: Voting Booth
  console.log('1. Requesting Voting Booth Consent...');
  const votingRequest = await requestVotingBoothConsent();
  
  // Request 2: UPI Gateway
  console.log('\n2. Requesting UPI Gateway Consent...');
  const upiRequest = await requestUPIConsent();
  
  // Request 3: DigiLocker
  console.log('\n3. Requesting DigiLocker Consent...');
  const digiLockerRequest = await requestDigiLockerConsent();

  // Request 4: CoWIN
  console.log('\n4. Requesting CoWIN Portal Consent...');
  const cowinRequest = await requestCoWINConsent();

  // Request 5: Bank KYC
  console.log('\n5. Requesting Bank KYC Consent...');
  const bankRequest = await requestBankKYCConsent();

  // Request 6: GST Portal
  console.log('\n6. Requesting GST Portal Consent...');
  const gstRequest = await requestGSTConsent();

  // Check status of one request
  if (votingRequest?.requestId) {
    console.log('\n7. Checking Voting Request Status...');
    await checkRequestStatus(votingRequest.requestId);
  }

  console.log('\n=== Demo Complete ===');
  console.log('\nNote: In a real application, the user would receive a notification');
  console.log('and the consent modal would appear on their dashboard.');
  console.log('\nEach provider creates a unique session with 30-second duration.');
  console.log('\nAll requests use only valid fields from vcSchema.js.');
}

// Run the demo if this file is executed directly
if (typeof window === 'undefined') {
  runDemo();
}

export {
  requestVotingBoothConsent,
  requestUPIConsent,
  requestDigiLockerConsent,
  requestCoWINConsent,
  requestBankKYCConsent,
  requestGSTConsent,
  checkRequestStatus
}; 