import deliveryBanner from "@/assets/delivery-banner.jpg";
const DeliveryBanner = () => {
  return (
    <div className="mx-4 my-3">
      <div className="rounded-xl overflow-hidden">
        <img 
          src={deliveryBanner} 
          alt="Entrega grátis a toda la región" 
          className="w-full h-auto object-cover"
        />
      </div>
    </div>
  );
};

export default DeliveryBanner;
