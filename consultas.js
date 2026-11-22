// 1. Insertar un documento
db.clientes.insertOne({
  _id: "C031",
  nombre: "Valeria Ospina",
  email: "valeria.ospina31@correo.com",
  ciudad: "Tunja",
  edad: 27,
  fecha_registro: ISODate("2026-11-20T00:00:00Z"),
  preferencias: [ "fotografía", "música" ]
})

// 2. Insertando muchos
db.productos.insertMany([
  {
    _id: "P041",
    nombre: "Xiaomi Smart Band 9",
    categoria: "Accesorios",
    marca: "Xiaomi",
    precio: 189000,
    stock: 25,
    especificaciones: { inalambrico: true, color: "negro" },
    etiquetas: [ "nuevo", "temporal" ],
    calificaciones: [],
    activo: true
  },
  {
    _id: "P042",
    nombre: "Soporte para portátil Genius",
    categoria: "Accesorios",
    marca: "Genius",
    precio: 65000,
    stock: 40,
    especificaciones: { inalambrico: false, color: "gris" },
    etiquetas: [ "temporal" ],
    calificaciones: [],
    activo: true
  }
])

// 3. Seleccionando con find
db.productos.find({ categoria: "Laptops" }, { _id: 0, nombre: 1, marca: 1, precio: 1 }).sort({ precio: 1 })

// 4. Actualización con updateOne y $set.
db.productos.updateOne({ _id: "P001" }, { $set: { precio: 3299000, stock: 15 } })

// 5. Eliminación con deleteOne
db.clientes.deleteOne({ _id: "C031" })

// 6. Rango de precios con $gte y $lte
db.productos.find({ categoria: "Celulares", precio: { $gte: 1000000, $lte: 3000000 } }, { _id: 0, nombre: 1, precio: 1 }).sort({ precio: 1 }).limit(5)

// 7. Operadores lógicos $and y $or
db.pedidos.find({
  $and: [
    { estado: "entregado" },
    { $or: [ { metodo_pago: "PSE" }, { metodo_pago: "Nequi" } ] },
    { total: { $gt: 2000000 } }
  ]
}, { _id: 1, metodo_pago: 1, total: 1 })


// 8. Join entre pedidos y clientes con $lookup

db.pedidos.aggregate([
  { $match: { estado: "pendiente" } },
  {
    $lookup: {
      from: "clientes",
      localField: "cliente_id",
      foreignField: "_id",
      as: "cliente"
    }
  },
  { $unwind: "$cliente" },
  {
    $project: {
      _id: 1,
      fecha: 1,
      total: 1,
      cliente: "$cliente.nombre",
      ciudad: "$cliente.ciudad"
    }
  }
])

// 9. Contar con countDocuments
db.pedidos.countDocuments({})

// 10. Contar por grupo: pedidos por estado
db.pedidos.aggregate([
  { $group: { _id: "$estado", cantidad: { $sum: 1 } } },
  { $sort: { cantidad: -1 } }
])

// 11. Sumar las ventas totales
db.pedidos.aggregate([
  { $match: { estado: { $ne: "cancelado" } } },
  {
    $group: {
      _id: null,
      ventas_totales: { $sum: "$total" },
      pedidos: { $sum: 1 }
    }
  }
])

// 12. Promediar el precio por categoría
db.productos.aggregate([
  {
    $group: {
      _id: "$categoria",
      precio_promedio: { $avg: "$precio" },
      precio_min: { $min: "$precio" },
      precio_max: { $max: "$precio" },
      productos: { $sum: 1 }
    }
  },
  {
    $project: {
      precio_promedio: { $round: [ "$precio_promedio", 0 ] },
      precio_min: 1,
      precio_max: 1,
      productos: 1
    }
  },
  { $sort: { precio_promedio: -1 } }
])

// 13. Top 5 de clientes por gasto

db.pedidos.aggregate([
  { $match: { estado: { $ne: "cancelado" } } },
  {
    $group: {
      _id: "$cliente_id",
      gasto_total: { $sum: "$total" },
      pedidos: { $sum: 1 }
    }
  },
  { $sort: { gasto_total: -1 } },
  { $limit: 5 },
  {
    $lookup: { from: "clientes", localField: "_id", foreignField: "_id", as: "c" }
  },
  {
    $project: {
      cliente: { $arrayElemAt: [ "$c.nombre", 0 ] },
      gasto_total: 1,
      pedidos: 1
    }
  }
])
