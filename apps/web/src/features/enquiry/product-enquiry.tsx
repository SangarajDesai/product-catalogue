import { useState } from "react";
import { Button } from "../../shared/components/button";
import { FeatureErrorBoundary } from "../../shared/components/feature-error-boundary";
import { EnquiryForm } from "./components/enquiry-form";
import "./enquiry.css";

function EnquiryEntry({ productId }: { productId: number }) {
  const [open, setOpen] = useState(false);
  return open ? (
    <EnquiryForm productId={productId} />
  ) : (
    <Button className="enquiry-button" onClick={() => setOpen(true)}>Enquire</Button>
  );
}

export function ProductEnquiry({ productId }: { productId: number }) {
  return (
    <div className="product-enquiry">
      <FeatureErrorBoundary message="Could not display the enquiry form.">
        <EnquiryEntry productId={productId} />
      </FeatureErrorBoundary>
    </div>
  );
}
