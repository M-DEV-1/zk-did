/*
i've written this out for my own reference. it's not to be used, and well, just don't use it. it's using the legacy pinata endpoints, and not very feasible.

we're using the new, and better private json uploads in /api/upload-vc/route.js
*/

import { NextResponse } from "next/server";

export default async function pinJSONtoIPFShandler(req, res) {
    if (req.method !== "POST") return res.status(405).end();
    try {
        const body = await req.json();
        // this is a legacy endpoint by Pinata
        const pinataRes = await fetch("https://api.pinata.cloud/pinning/pinJSONtoIPFS", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                pinata_api_key: process.env.PINATA_API_KEY, // runs server-side only, so it's safe to send
                pinata_secret_api_key: process.env.PINATA_API_SECRET,
            },
            body: JSON.stringify(body),
        });

        const data = await pinataRes.json();
        if (!pinataRes.ok) {
            throw new Error(data.error || "Pinata Upload Failed");
        } else {
            return NextResponse.json({ cid: data.IpfsHash }, { status: 200 });
        }
    } catch (error) {
        console.log("couldn't upload to ipfs"); // remove in production
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}