import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function PanelAlertas() {
  const [alertas, setAlertas] = useState([]);
  const [alertaSeleccionada, setAlertaSeleccionada] = useState(null);
  const [error, setError] = useState(null);

  // Cargar las alertas al montar el componente
  useEffect(() => {
    axios.get('http://127.0.0.1:8000/api/alertas')
      .then(response => {
        setAlertas(response.data);
      })
      .catch(err => {
        console.error("Error al cargar las alertas:", err);
        setError("No se pudieron cargar las alertas del servidor.");
      });
  }, []);

  // Consultar el detalle de una alerta específica
  const verDetalle = (id) => {
    axios.get(`http://127.0.0.1:8000/api/alertas/${id}`)
      .then(response => {
        setAlertaSeleccionada(response.data);
      })
      .catch(err => {
        console.error("Error al cargar el detalle de la alerta:", err);
      });
  };

  return (
    <div className="container mt-4">
      <h2>EcoDet - Mis Alertas</h2>
      {error && <div className="alert alert-danger">{error}</div>}

      <div className="row mt-3">
        {/* Columna de Listado */}
        <div className="col-md-6">
          <h4>Listado de Alertas</h4>
          {alertas.length === 0 ? (
            <p className="text-muted">No hay alertas registradas.</p>
          ) : (
            <ul className="list-group">
              {alertas.map(alerta => (
                <li 
                  key={alerta.id} 
                  className="list-group-item list-group-item-action"
                  style={{ cursor: 'pointer' }}
                  onClick={() => verDetalle(alerta.id)}
                >
                  <strong>{alerta.titulo || `Alerta #${alerta.id}`}</strong> 
                  <span className="float-end badge bg-secondary">{alerta.estado}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Columna de Detalle */}
        <div className="col-md-6">
          <h4>Detalle de la Alerta</h4>
          {alertaSeleccionada ? (
            <div className="card p-3 shadow-sm">
              <h5 className="text-primary">{alertaSeleccionada.titulo}</h5>
              <p><strong>Descripción:</strong> {alertaSeleccionada.descripcion}</p>
              <p><strong>Estado:</strong> <span className="badge bg-info">{alertaSeleccionada.estado}</span></p>
              <p><strong>Fecha de Creación:</strong> {alertaSeleccionada.fecha_creacion || 'N/A'}</p>
            </div>
          ) : (
            <p className="text-muted">Selecciona una alerta de la lista para ver sus detalles completos.</p>
          )}
        </div>
      </div>
    </div>
  );
}
