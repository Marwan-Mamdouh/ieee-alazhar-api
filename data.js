
const officers = [
    { id: 1, name: "Ahmed Bahaa", position: "Chairman", image: "https://example.com/images/bahaa.jpg", bio: "Engineering student, leading the charge.", linkedin: "https://linkedin.com/in/ahmedbahaa" },
    { id: 2, name: "Sara Gamal", position: "Vice Chairman", image: "https://example.com/images/sara.jpg", bio: "Passionate about technology and management.", linkedin: "https://linkedin.com/in/saragamal" },
];

const technical = [
    { id: 3, name: "Ali Mahmoud", position: "Technical Head", image: "https://example.com/images/ali.jpg", bio: "Expert in embedded systems.", linkedin: "https://linkedin.com/in/alimahmoud" },
    { id: 4, name: "Nour Tarek", position: "Web Developer", image: "https://example.com/images/nour.jpg", bio: "Frontend wizard.", linkedin: "https://linkedin.com/in/nourtarek" },
];

const branding = [
    { id: 5, name: "Fatma Omar", position: "Branding Manager", image: "https://example.com/images/fatma.jpg", bio: "Creating visual identity.", linkedin: "https://linkedin.com/in/fatmaomar" },
];

const operation = [
    { id: 6, name: "Khaled Adel", position: "Operation Lead", image: "https://example.com/images/khaled.jpg", bio: "Logistics and event coordination.", linkedin: "https://linkedin.com/in/khaledadel" },
];

const lastChairman = {
    id: 99,
    name: "Mohamed Abdulmoneim",
    year: "2023-2024",
    image: "https://example.com/images/last-chairman.jpg",
    bio: "Studies at Al-Azhar University Faculty of Languages and Translation, works as a freelance Arabic and Islamic Studies teacher.",
    linkedin: "https://www.linkedin.com/in/muhammad-abdulmoneim/"
};


module.exports = {
    officers,
    technical,
    branding,
    operation,
    lastChairman
};