// Lógica central de gamificación: cuántos puntos vale cada acción y cómo
// se registran. Los puntos NO se asignan a mano: solo se otorgan de forma
// automática cuando ocurre la acción real de cuidado correspondiente.

const prisma = require("./prismaClient");

// Puntos que otorga cada tipo de acción.
const PUNTOS_POR_ACCION = {
  confirmar_toma: 18, // el usuario confirma que una toma fue realizada
  registrar_sintoma: 5, // se registra un síntoma del paciente
  invitar_familiar: 15, // al ACEPTAR la invitación se premia a quien invitó
};

// Acciones que el usuario puede disparar por sí mismo desde la app.
// El resto solo se otorgan automáticamente desde su flujo correspondiente.
const ACCIONES_AUTOSERVICIO = ["confirmar_toma"];

// Registra una acción y suma sus puntos al usuario indicado.
async function otorgarPuntos({ usuarioId, tipo, circuloId = null }) {
  const puntos = PUNTOS_POR_ACCION[tipo];
  if (!puntos) {
    throw new Error(`tipo_accion no válido: ${tipo}`);
  }

  await prisma.accionPuntos.create({
    data: { usuarioId, tipo, puntos, circuloId },
  });

  return puntos;
}

module.exports = { PUNTOS_POR_ACCION, ACCIONES_AUTOSERVICIO, otorgarPuntos };
