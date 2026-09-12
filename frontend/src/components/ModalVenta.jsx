export const ModalVenta = () => {
  return (
    <div className="modal fade" id="modalVenta" tabIndex="-1" aria-hidden="true">
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content border-0 p-3" style={{ borderRadius: '16px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
          <div className="modal-header border-0 pb-0">
            <div>
              <h4 className="modal-title fw-bold text-main">Detalle de Venta</h4>
              <p className="text-muted-custom small mb-0 mt-1">Resumen del ticket de venta procesado</p>
            </div>
            <button type="button" className="btn-close" data-bs-dismiss="modal"></button>
          </div>
          
          <div className="modal-body pb-0">
            <div className="d-flex justify-content-between align-items-center mb-4 mt-2">
              <div>
                <small className="text-muted-custom fw-bold d-block" style={{ fontSize: '10px', letterSpacing: '0.5px' }}>N° DE TICKET</small>
                <strong className="text-brand fs-6">TKT-100234</strong>
              </div>
              <div className="text-end">
                <small className="text-muted-custom fw-bold d-block" style={{ fontSize: '10px', letterSpacing: '0.5px' }}>FECHA</small>
                <strong className="text-main fs-6">Hoy, 14:32:05</strong>
              </div>
            </div>
            
            <div className="mb-4">
              <small className="text-muted-custom fw-bold d-block mb-1" style={{ fontSize: '10px', letterSpacing: '0.5px' }}>CLIENTE</small>
              <p className="mb-0 text-main fw-bold">Maria S. Torres Prado <span className="text-muted-custom fw-normal mx-1">—</span> <span className="fw-semibold">DNI 10748392</span></p>
            </div>
            
            <table className="table table-borderless table-sm align-middle mb-4 border-bottom border-custom pb-2">
              <thead>
                <tr className="text-muted-custom border-bottom border-custom" style={{ fontSize: '10px', letterSpacing: '0.5px' }}>
                  <th className="fw-bold pb-3">PRODUCTO</th><th className="fw-bold pb-3 text-center">CANT.</th><th className="fw-bold pb-3 text-center">PRECIO</th><th className="text-end fw-bold pb-3">SUBTOTAL</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="py-3"><span className="text-main fw-semibold d-block" style={{ fontSize: '13px' }}>Paracetamol 500mg</span><small className="text-muted-custom" style={{ fontSize: '11px' }}>(Blister x10)</small></td>
                  <td className="py-3 text-center text-muted-custom" style={{ fontSize: '13px' }}>2</td>
                  <td className="py-3 text-center text-muted-custom" style={{ fontSize: '13px' }}>S/. 5.00</td>
                  <td className="py-3 text-end text-main fw-bold" style={{ fontSize: '13px' }}>S/. 10.00</td>
                </tr>
              </tbody>
            </table>
            
            <div className="d-flex justify-content-between align-items-center bg-light border border-custom p-3 rounded-3 mb-3">
              <h6 className="fw-bold text-main mb-0">TOTAL</h6>
              <h4 className="fw-bold text-brand mb-0">S/. 32.50</h4>
            </div>
          </div>
          
          <div className="modal-footer border-0 d-flex justify-content-center mt-3 gap-3">
            <button type="button" className="btn bg-white border border-custom text-main fw-bold py-2 px-4" data-bs-dismiss="modal">Cerrar</button>
            <button type="button" className="btn btn-brand fw-bold py-2 px-4 d-flex align-items-center gap-2">
              <i className="ph ph-cube fs-5"></i> Imprimir Ticket
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};