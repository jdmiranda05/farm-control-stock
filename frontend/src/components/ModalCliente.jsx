export const ModalCliente = () => {
  return (
    <div className="modal fade" id="modalNuevoCliente" tabIndex="-1" aria-hidden="true">
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content border-0 p-3" style={{ borderRadius: '16px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
          <div className="modal-header border-bottom border-custom pb-3">
            <h5 className="modal-title fw-bold text-main">Nuevo Cliente</h5>
            <button type="button" className="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div className="modal-body py-4">
            <div className="mb-3">
              <label className="form-label text-muted-custom fw-bold" style={{ fontSize: '11px' }}>DNI / RUC</label>
              <input type="text" className="form-control" placeholder="Ingrese número de documento" />
            </div>
            <div className="mb-3">
              <label className="form-label text-muted-custom fw-bold" style={{ fontSize: '11px' }}>NOMBRE COMPLETO</label>
              <input type="text" className="form-control" placeholder="Nombres y Apellidos" />
            </div>
          </div>
          <div className="modal-footer border-0 d-flex justify-content-end gap-2">
            <button type="button" className="btn bg-white border border-custom text-main fw-bold py-2 px-4" data-bs-dismiss="modal">Cancelar</button>
            <button type="button" className="btn btn-brand fw-bold py-2 px-4">Guardar</button>
          </div>
        </div>
      </div>
    </div>
  );
};