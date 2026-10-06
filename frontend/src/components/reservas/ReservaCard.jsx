import { Users } from "lucide-react";

export default function ReservaCard({
  reserva,
  onSeleccionar,
}) {
  return (
    <article
      className={`reserva ${reserva.estado}`}
      onClick={() => onSeleccionar(reserva)}
    >
      <strong>
        {reserva.cliente}
      </strong>

      <span>
        {reserva.inicio} - {reserva.fin}
      </span>

      <small className="cantidad-personas-reserva">
        <Users />

        {reserva.personas} personas
      </small>

    </article>
  );
}