import Link from "next/link";
import { Reveal } from "@/components/animations/Reveal";
import type { ShreeAir } from "@/lib/shree-air";

const services = [
  { product: "trehub", module: "flights", number: "01", title: "Flights", description: "Find your way there. Discuss routes, travel dates and flight options with our team.", icon: "↗" },
  { product: "trehub", module: "hotels", number: "02", title: "Hotel stays", description: "A place to settle in. Explore stays around your destination, comfort and budget.", icon: "⌂" },
  { product: "trevista", module: "tours", number: "03", title: "Tours & holidays", description: "More of what you love. Bring your interests and holiday plans into one itinerary.", icon: "◎" },
  { product: "trevio", module: "trips", number: "04", title: "Trips & group journeys", description: "Good journeys, shared. Plan time away with family, friends or your travel group.", icon: "≋" },
];

const travelServices = [
  { module: "visa-passport", number: "05", title: "Visa & passport assistance", description: "Get help with visa applications, passport applications and renewals, and required travel documents.", icon: "▤" },
  { module: "cabs", number: "06", title: "Cab bookings", description: "Arrange airport transfers, local rides and outstation cab journeys around your travel plans.", icon: "↔" },
  { module: "trains", number: "07", title: "Train bookings", description: "Explore train routes and get help booking rail journeys for your preferred dates.", icon: "≋" },
  { module: "insurance", number: "08", title: "Travel insurance", description: "Discuss travel insurance options for your journey with our team.", icon: "◇" },
];

export function Services({ client }: { client: ShreeAir }) {
  return <section id="services" className="sa-section sa-shell"><Reveal className="sa-section-heading"><p className="sa-eyebrow">THE WAY YOU WANT TO TRAVEL</p><h2>A world of possibilities.<br />One team to bring it together.</h2><p>Choose where you want to begin. We’ll help you explore the options.</p></Reveal><div className="sa-service-grid">{[...services.filter(service => client.modules?.[service.product]?.includes(service.module)), ...travelServices].map((service, index) => <Reveal className="sa-service-card" key={service.module} delay={index * 70}><div className="sa-card-top"><span>{service.number}</span><span className="sa-service-icon" aria-hidden="true">{service.icon}</span></div><h3>{service.title}</h3><p>{service.description}</p><Link href="/contact" aria-label={`Enquire about ${service.title}`}>Let’s explore <span>↗</span></Link></Reveal>)}</div></section>;
}
