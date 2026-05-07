import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";

function PackageDetail() {
    const { id } = useParams(); // Get package ID from URL
    const [pkg, setPkg] = useState(null);

    useEffect(() => {
        function getApiBase() {
            const raw = process.env.REACT_APP_API_URL;
            if (raw && raw !== "") return raw.replace(/\/$/, "");
            return process.env.NODE_ENV === "development" ? "http://localhost:5000" : "";
        }

        const base = getApiBase();
        axios
            .get(`${base}/api/packages/${id}`)
            .then((res) => setPkg(res.data))
            .catch((err) => console.log("Error fetching package:", err));
    }, [id]);

    if (!pkg) return <p>Loading package...</p>;

    return (
        <div style={{ padding: "20px" }}>
            <h1>{pkg.title}</h1>
            <img src={pkg.imageUrl} alt={pkg.title} style={{ width: "100%", maxWidth: "600px" }} />
            <h3>Destination: {pkg.destination}</h3>
            <p>Price: ₹{pkg.price}</p>
            <p>Duration: {pkg.duration}</p>
            <p>{pkg.description}</p>
        </div>
    );
}

export default PackageDetail;
