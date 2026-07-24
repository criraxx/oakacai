import deliveryBanner from "@/assets/delivery-banner.jpg";
const DeliveryBanner = () => {
  return (
    <div className="mx-4 my-3">
      <div className="rounded-xl overflow-hidden">
        <img 
          src={deliveryBanner} 
          alt="Envío gratis en todas las zonas" 
          className="w-2/3 mx-auto h-auto object-cover"
        />
      </div>
    </div>
  );
};

export default DeliveryBanner;
