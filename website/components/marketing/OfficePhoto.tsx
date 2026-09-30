"use client";

import Image from "next/image";
import { useRef } from "react";

const officePhoto = "https://res.cloudinary.com/dofxshf3z/image/upload/v1790519408/travelstrem/site-assets/f4df5b432f910be6b5cafa38.png";

export function OfficePhoto() {
  const dialog = useRef<HTMLDialogElement>(null);
  return (
    <div className="office-photo">
      <button className="button" type="button" onClick={() => dialog.current?.showModal()}>
        View office
      </button>
      <dialog ref={dialog} className="office-photo-dialog" aria-labelledby="office-photo-title"
        onClick={(event) => { if (event.target === event.currentTarget) dialog.current?.close(); }}>
        <div className="office-photo-dialog__content">
          <header>
            <h2 id="office-photo-title">Our Jaipur office</h2>
            <button type="button" className="button" onClick={() => dialog.current?.close()} autoFocus aria-label="Close office photo">Close</button>
          </header>
          <Image src={officePhoto} alt="Shree Air Tours & Travels office entrance in Jaipur" width={743} height={628} sizes="(max-width: 800px) 90vw, 900px" />
        </div>
      </dialog>
    </div>
  );
}
