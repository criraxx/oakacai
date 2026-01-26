import deliveryBanner from "@/assets/delivery-banner.png";

const DeliveryBanner = () => {
  return (
    <div className="mx-4 my-3">
      <div className="rounded-xl overflow-hidden">
        <img 
          src={deliveryBanner} 
          alt="Entrega grátis em todas as regiões" 
          className="w-2/3 mx-auto h-auto object-cover"
        />
      </div>
    </div>
  );
};

export default DeliveryBanner;
