const InfoBar = () => {
  return <div className="px-4 py-2 text-xs border-b border-border flex-row flex items-center justify-between gap-0">
      <div className="flex items-center mt-0 gap-0">
        <span className="text-accent font-medium text-xs">Aberto agora.</span>
        <span className="text-muted-foreground">-</span>
        <span className="text-muted-foreground">3,8 km de você</span>
        
        <span className="text-muted-foreground">-Pedido mín.</span>
        <span className="text-foreground mx-0 my-0 pb-0 font-medium text-left"> R$ 30,00</span>
      </div>
      
    </div>;
};
export default InfoBar;