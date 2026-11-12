import { Pedido } from '../models/Pedido.js';

export const obtenerPedidos = async (req, res) => {
  try {
    const pedidos = await Pedido.find().sort({ createdAt: -1 });
    res.status(200).json(pedidos);
  } catch (error) {
    res.status(500).json({
      mensaje: 'Error al obtener los pedidos',
      error: error.message
    });
  }
};

export const crearPedido = async (req, res) => {
  try {
    const nuevoPedido = await Pedido.create(req.body);
    res.status(201).json(nuevoPedido);
  } catch (error) {
    res.status(400).json({
      mensaje: 'Error al crear el pedido',
      error: error.message
    });
  }
};

export const actualizarPedido = async (req, res) => {
  try {
    const { id } = req.params;
    const pedidoActualizado = await Pedido.findByIdAndUpdate(
      id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!pedidoActualizado) {
      return res.status(404).json({
        mensaje: 'Pedido no encontrado'
      });
    }

    res.status(200).json(pedidoActualizado);
  } catch (error) {
    res.status(400).json({
      mensaje: 'Error al actualizar el pedido',
      error: error.message
    });
  }
};

export const eliminarPedido = async (req, res) => {
  try {
    const { id } = req.params;
    const pedidoEliminado = await Pedido.findByIdAndDelete(id);

    if (!pedidoEliminado) {
      return res.status(404).json({
        mensaje: 'Pedido no encontrado'
      });
    }

    res.status(200).json({
      mensaje: 'Pedido eliminado correctamente'
    });
  } catch (error) {
    res.status(400).json({
      mensaje: 'Error al eliminar el pedido',
      error: error.message
    });
  }
};

