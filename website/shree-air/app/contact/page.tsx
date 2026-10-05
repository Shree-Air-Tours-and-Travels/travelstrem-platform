import { pageMetadata } from "@/lib/seo";
import { getShreeAir } from "@/lib/shree-air";
import { EnquiryForm } from "@/components/shree-air/EnquiryForm";
export const metadata = pageMetadata('Contact a Travel Agent in Jaipur', 'Contact Shree Air Tours & Travels in Jaipur to discuss flight tickets, hotel bookings, holiday packages, tours and group travel with our team.', '/contact');
export default async function ContactShreeAir() {
  const client = await getShreeAir();
  return <section className="sa-shell sa-section sa-contact-grid"><div><p className="sa-eyebrow">LET’S MAKE A PLAN</p><h1>Your next journey<br />starts here.</h1><p className="sa-lead">A destination in mind? A question about a trip? Tell us a little about your plans and our travel team will get in touch.</p><div className="sa-contact-details">{client.contactPhone && <div><span>Prefer a conversation?</span><a href={`tel:${client.contactPhone}`}>Call {client.contactPhone} ↗</a></div>}{client.contactEmail && <div><span>Write to us</span><a href={`mailto:${client.contactEmail}`}>{client.contactEmail} ↗</a></div>}{client.business?.address && <div><span>Find our team</span><p>{client.business.address}</p></div>}</div></div><EnquiryForm /></section>;
}
