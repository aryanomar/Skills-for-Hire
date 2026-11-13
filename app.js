/**
 * ============================================================================
 * P25: SKILLS FOR HIRE (CAMPUS EDITION) - CORE APPLICATION LOGIC
 * Solves: 1. Trust (UMS Verification)
 *         2. Payment Disputes (50% Escrow + Fair-Price Floor)
 *         3. Late Submissions (Smart Scope + Deadline Tracker)
 * ============================================================================
 */

// ----------------------------------------------------------------------------
// MODULE 1: FAIR-PRICE BASELINE DATA (Prevents student underpricing)
// ----------------------------------------------------------------------------
const FAIR_PRICE_MIN = {
    "Design": 300,
    "Code": 800,
    "Video Editing": 500,
    "Photography": 600
};

// ----------------------------------------------------------------------------
// MODULE 2: INITIAL SEED DATA (Loaded if LocalStorage is empty)
// ----------------------------------------------------------------------------
const DEFAULT_GIGS = [
    {
        id: 101,
        title: "Hackathon Instagram Reel Edit",
        category: "Video Editing",
        budget: 700,
        deadline: "2 Days",
        client: "TechFest Core Team",
        verifiedClient: true,
        description: "Need a 45-second high-energy promo reel with captions and music sync. Raw clips provided."
    },
    {
        id: 102,
        title: "Club Registration Landing Page",
        category: "Code",
        budget: 1200,
        deadline: "4 Days",
        client: "AI & Robotics Society",
        verifiedClient: true,
        description: "Responsive HTML/Tailwind page with Google Form embed and mobile-friendly event schedule."
    },
    {
        id: 103,
        title: "3 Event Posters for Cultural Night",
        category: "Design",
        budget: 500,
        deadline: "3 Days",
        client: "Student Welfare Wing",
        verifiedClient: true,
        description: "Need 3 A3 print-ready posters + Instagram square versions. Editable Canva/Figma link required."
    }
];

const DEFAULT_TALENT = [
    {
        name: "Aarav Sharma",
        umsId: "12204581",
        skill: "Code",
        role: "Frontend & Python Developer",
        rating: "4.9",
        onTimeRate: "100%",
        completedGigs: 7,
        badge: "Startup-Cell Endorsed",
        portfolio: "github.com/aarav-campus"
    },
    {
        name: "Priya Nair",
        umsId: "12208934",
        skill: "Design",
        role: "UI/UX & Brand Designer",
        rating: "4.8",
        onTimeRate: "96%",
        completedGigs: 12,
        badge: "Top Campus Creator",
        portfolio: "behance.net/priya-lpu"
    },
    {
        name: "Rohan Verma",
        umsId: "12103390",
        skill: "Video Editing",
        role: "Premiere Pro & Motion Editor",
        rating: "5.0",
        onTimeRate: "100%",
        completedGigs: 5,
        badge: "Verified UMS ID",
        portfolio: "drive.google.com/rohan-reels"
    }
];

const DEFAULT_CONTRACTS = [
    {
        id: 501,
        title: "Startup Weekend Pitch Deck Design",
        client: "Incubation Cell Mentor",
        freelancer: "Priya Nair (12208934)",
        deliverables: "12-slide investor deck in Figma + PDF export",
        totalPrice: 900,
        escrowLocked: 450,
        revisionsUsed: 1,
        maxRevisions: 2,
        daysLeft: 2,
        status: "In Progress (50% Escrow Locked)"
    }
];

// ----------------------------------------------------------------------------
// MODULE 3: STATE MANAGEMENT WITH BROWSER LOCALSTORAGE
// Allows your team to test real gigs end-to-end and keep changes on refresh
// ----------------------------------------------------------------------------
let gigs = JSON.parse(localStorage.getItem("p25_gigs")) || DEFAULT_GIGS;
let talent = JSON.parse(localStorage.getItem("p25_talent")) || DEFAULT_TALENT;
let contracts = JSON.parse(localStorage.getItem("p25_contracts")) || DEFAULT_CONTRACTS;

function saveState() {
    localStorage.setItem("p25_gigs", JSON.stringify(gigs));
    localStorage.setItem("p25_talent", JSON.stringify(talent));
    localStorage.setItem("p25_contracts", JSON.stringify(contracts));
}

function resetDemoData() {
    localStorage.clear();
    location.reload();
}

// ----------------------------------------------------------------------------
// MODULE 4: NAVIGATION TAB SWITCHER
// ----------------------------------------------------------------------------
function switchTab(tabName) {
    // Hide all views
    document.querySelectorAll(".tab-view").forEach(view => view.classList.add("hidden"));
    // Remove active style from all tab buttons
    document.querySelectorAll(".tab-btn").forEach(btn => btn.classList.remove("active-tab"));

    // Show selected view and highlight button
    document.getElementById(`view-${tabName}`).classList.remove("hidden");
    document.getElementById(`tab-${tabName}`).classList.add("active-tab");
}

// ----------------------------------------------------------------------------
// MODULE 5: RENDER MICRO-GIG BOARD & MATCHING WORKFLOW
// ----------------------------------------------------------------------------
function renderGigs() {
    const container = document.getElementById("gigs-container");
    const filter = document.getElementById("gig-filter").value;

    const filteredGigs = filter === "All" 
        ? gigs 
        : gigs.filter(g => g.category === filter);

    container.innerHTML = filteredGigs.map(gig => `
        <div class="bg-white rounded-xl border border-slate-200 p-5 flex flex-col justify-between hover-card">
            <div>
                <div class="flex justify-between items-start gap-2 mb-3">
                    <span class="text-xs font-semibold bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-md">
                        ${gig.category}
                    </span>
                    <span class="text-xs font-medium text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md">
                        ✓ Escrow Ready
                    </span>
                </div>
                <h3 class="font-bold text-base text-slate-900 mb-1">${gig.title}</h3>
                <p class="text-xs text-slate-500 mb-3">Posted by: <strong>${gig.client}</strong></p>
                <p class="text-sm text-slate-600 mb-4">${gig.description}</p>
            </div>

            <div class="border-t border-slate-100 pt-3 mt-2">
                <div class="flex justify-between items-center text-sm mb-3">
                    <div>
                        <span class="text-xs text-slate-400 block">Fair Budget</span>
                        <span class="font-bold text-slate-900">₹${gig.budget}</span>
                    </div>
                    <div class="text-right">
                        <span class="text-xs text-slate-400 block">Timeline</span>
                        <span class="font-medium text-slate-700">⏱ ${gig.deadline}</span>
                    </div>
                </div>
                <button onclick="prefillContractFromGig(${gig.id})" class="w-full bg-slate-900 hover:bg-indigo-600 text-white text-xs font-semibold py-2.5 rounded-lg transition">
                    Accept Gig & Lock Scope →
                </button>
            </div>
        </div>
    `).join("");
}

// Pre-fills the Smart Scope Builder when a student clicks "Accept Gig"
function prefillContractFromGig(gigId) {
    const selectedGig = gigs.find(g => g.id === gigId);
    if (!selectedGig) return;

    document.getElementById("contract-title").value = selectedGig.title;
    document.getElementById("contract-category").value = selectedGig.category;
    document.getElementById("contract-client").value = selectedGig.client;
    document.getElementById("contract-deliverables").value = selectedGig.description;
    document.getElementById("contract-price").value = selectedGig.budget;

    checkFairPriceInScope();
    switchTab("scope");
}

// ----------------------------------------------------------------------------
// MODULE 6: RENDER VERIFIED SKILL DIRECTORY (Solves Trust Pain Point)
// ----------------------------------------------------------------------------
function renderTalent() {
    const container = document.getElementById("talent-container");
    container.innerHTML = talent.map(person => `
        <div class="bg-white rounded-xl border border-slate-200 p-5 hover-card">
            <div class="flex justify-between items-start mb-3">
                <div>
                    <h3 class="font-bold text-base text-slate-900">${person.name}</h3>
                    <p class="text-xs text-slate-500">${person.role} &bull; UMS: ${person.umsId}</p>
                </div>
                <span class="bg-amber-100 text-amber-800 text-xs font-bold px-2 py-1 rounded">
                    ★ ${person.rating}
                </span>
            </div>

            <div class="mb-4">
                <span class="inline-block text-xs bg-indigo-50 text-indigo-700 font-medium px-2.5 py-1 rounded-md">
                    🛡️ ${person.badge}
                </span>
            </div>

            <div class="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-lg text-xs mb-4">
                <div>
                    <span class="text-slate-400 block">On-Time Delivery</span>
                    <span class="font-bold text-emerald-700">${person.onTimeRate}</span>
                </div>
                <div>
                    <span class="text-slate-400 block">Campus Gigs Done</span>
                    <span class="font-bold text-slate-800">${person.completedGigs} Verified</span>
                </div>
            </div>

            <div class="flex justify-between items-center text-xs">
                <span class="text-slate-500 truncate">🔗 ${person.portfolio}</span>
                <button onclick="hireFreelancer('${person.name} (${person.umsId})', '${person.skill}')" class="text-indigo-600 font-semibold hover:underline">
                    Hire Now →
                </button>
            </div>
        </div>
    `).join("");
}

function hireFreelancer(freelancerString, skillCategory) {
    document.getElementById("contract-freelancer").value = freelancerString;
    document.getElementById("contract-category").value = skillCategory;
    switchTab("scope");
}

// ----------------------------------------------------------------------------
// MODULE 7: SMART SCOPE & FAIR-PRICE GUARDRAIL (Solves Payment & Late Issues)
// ----------------------------------------------------------------------------
function checkFairPriceInScope() {
    const category = document.getElementById("contract-category").value;
    const price = Number(document.getElementById("contract-price").value);
    const minPrice = FAIR_PRICE_MIN[category] || 300;
    const warningBox = document.getElementById("fair-price-warning");

    if (price > 0 && price < minPrice) {
        warningBox.classList.remove("hidden");
        warningBox.innerHTML = `⚠️ <strong>Fair-Price Alert:</strong> Campus baseline for <strong>${category}</strong> is at least <strong>₹${minPrice}</strong>. Underpricing leads to low priority and disputes.`;
    } else {
        warningBox.classList.add("hidden");
    }
}

function createEscrowContract(event) {
    event.preventDefault();

    const totalPrice = Number(document.getElementById("contract-price").value);
    const newContract = {
        id: Date.now(),
        title: document.getElementById("contract-title").value,
        client: document.getElementById("contract-client").value,
        freelancer: document.getElementById("contract-freelancer").value,
        deliverables: document.getElementById("contract-deliverables").value,
        totalPrice: totalPrice,
        escrowLocked: Math.round(totalPrice * 0.5),
        revisionsUsed: 0,
        maxRevisions: Number(document.getElementById("contract-revisions").value),
        daysLeft: Number(document.getElementById("contract-days").value),
        status: "In Progress (50% Escrow Locked)"
    };

    contracts.unshift(newContract);
    saveState();
    renderContracts();
    event.target.reset();
    switchTab("tracker");
}

// ----------------------------------------------------------------------------
// MODULE 8: ACTIVE GIG TRACKER (Simulates Milestones, Revisions & Payout)
// ----------------------------------------------------------------------------
function renderContracts() {
    const container = document.getElementById("contracts-container");

    if (contracts.length === 0) {
        container.innerHTML = `<p class="text-sm text-slate-500">No active contracts yet. Create one in Tab 3!</p>`;
        return;
    }

    container.innerHTML = contracts.map(c => {
        const isCompleted = c.status.includes("Completed");
        return `
        <div class="bg-white rounded-xl border border-slate-200 p-5 flex flex-wrap justify-between items-center gap-4">
            <div class="space-y-1 max-w-xl">
                <div class="flex items-center gap-2">
                    <span class="text-xs font-bold px-2.5 py-0.5 rounded-full ${isCompleted ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}">
                        ${c.status}
                    </span>
                    <span class="text-xs text-slate-500">⏱ ${c.daysLeft} Days Remaining</span>
                </div>
                <h3 class="font-bold text-base text-slate-900">${c.title}</h3>
                <p class="text-xs text-slate-600">
                    <strong>Client:</strong> ${c.client} &bull; <strong>Freelancer:</strong> ${c.freelancer}
                </p>
                <p class="text-xs text-slate-500"><strong>Locked Scope:</strong> ${c.deliverables}</p>
            </div>

            <div class="flex flex-wrap items-center gap-4 border-t md:border-t-0 pt-3 md:pt-0 w-full md:w-auto justify-between">
                <div class="text-xs space-y-1">
                    <div>Total Agreed: <strong>₹${c.totalPrice}</strong> (Escrow Held: ₹${c.escrowLocked})</div>
                    <div>Revisions Used: <strong>${c.revisionsUsed} / ${c.maxRevisions}</strong></div>
                </div>

                ${!isCompleted ? `
                <div class="flex gap-2">
                    <button onclick="useRevision(${c.id})" class="border border-slate-300 hover:bg-slate-100 text-xs font-medium px-3 py-2 rounded-lg">
                        + Log Revision
                    </button>
                    <button onclick="completeContract(${c.id})" class="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-3 py-2 rounded-lg">
                        Approve & Release 100% Pay
                    </button>
                </div>
                ` : `
                <span class="text-xs font-semibold text-emerald-700">✓ Full Payment Released & Portfolio Verified</span>
                `}
            </div>
        </div>
        `;
    }).join("");
}

function useRevision(contractId) {
    const c = contracts.find(item => item.id === contractId);
    if (!c) return;

    if (c.revisionsUsed < c.maxRevisions) {
        c.revisionsUsed += 1;
        saveState();
        renderContracts();
    } else {
        alert("Scope Limit Reached! Additional revisions require a ₹100 add-on to protect freelancer time.");
    }
}

function completeContract(contractId) {
    const c = contracts.find(item => item.id === contractId);
    if (!c) return;

    c.status = "Completed (100% Paid)";
    c.escrowLocked = 0;
    saveState();
    renderContracts();
}

// ----------------------------------------------------------------------------
// MODULE 9: POST NEW GIG MODAL HANDLER
// ----------------------------------------------------------------------------
function togglePostGigModal(show) {
    const modal = document.getElementById("post-gig-modal");
    if (show) {
        modal.classList.remove("hidden");
        modal.classList.add("flex");
    } else {
        modal.classList.add("hidden");
        modal.classList.remove("flex");
    }
}

function handleNewGigSubmit(event) {
    event.preventDefault();

    const newGig = {
        id: Date.now(),
        title: document.getElementById("new-gig-title").value,
        category: document.getElementById("new-gig-category").value,
        budget: Number(document.getElementById("new-gig-budget").value),
        client: document.getElementById("new-gig-client").value,
        deadline: document.getElementById("new-gig-deadline").value,
        verifiedClient: true,
        description: document.getElementById("new-gig-desc").value
    };

    gigs.unshift(newGig);
    saveState();
    renderGigs();
    togglePostGigModal(false);
    event.target.reset();
    switchTab("gigs");
}

// Initialize all views when page loads
window.addEventListener("DOMContentLoaded", () => {
    renderGigs();
    renderTalent();
    renderContracts();
});