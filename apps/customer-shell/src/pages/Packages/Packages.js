import axios from "axios";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

function Packages() {
    const [packages, setPackages] = useState([]);

    // Fetch all packages from the backend
    useEffect(() => {
        function getApiBase() {
            const raw = process.env.REACT_APP_API_URL;
            if (raw && raw !== "") return raw.replace(/\/$/, "");
            return process.env.NODE_ENV === "development" ? "http://localhost:5000" : "";
        }

        const base = getApiBase();

        axios
            .get(`${base}/api/packages`)
            .then((res) => {
                console.log("Fetched packages:", res.data);
                setPackages(res.data);
            })
            .catch((err) => console.log("Error fetching packages:", err));
    }, []);


    // If no packages found, show a message 
    if (packages.length === 0) {
        return <div>No packages available at the moment.</div>;
    }
    return (
        <div>
            <h1>All Packages</h1>
            {packages.map(pkg => (
                <div key={pkg._id} style={{ border: "1px solid #ccc", padding: "10px", width: "250px" }}>
                    <img src={pkg.imageUrl} alt={pkg.title} style={{ width: "100%", height: "150px" }} />
                    <h3>{pkg.title}</h3>
                    <p>{pkg.destination}</p>
                    <p>₹{pkg.price}</p>
                    <p>{pkg.duration}</p>

                    {/* Add a link to detail page */}
                    <Link to={`/packages/${pkg._id}`}>View Details</Link>
                </div>
            ))}
        </div>
    );
}

export default Packages;
