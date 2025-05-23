import React, { useState, useEffect } from "react";
import * as XLSX from "xlsx";

export default function App() {
  const [recetas, setRecetas] = useState([]);
  const [comensales, setComensales] = useState(0);
  const [resultado, setResultado] = useState([]);
  const [filtroDia, setFiltroDia] = useState("semana");
  const [modoOscuro, setModoOscuro] = useState(true);
  const [menu, setMenu] = useState({
    lunes: { principal: "", acompanamiento: "", postre: "" },
    martes: { principal: "", acompanamiento: "", postre: "" },
    miercoles: { principal: "", acompanamiento: "", postre: "" },
    jueves: { principal: "", acompanamiento: "", postre: "" },
    viernes: { principal: "", acompanamiento: "", postre: "" },
  });
  const [nuevaReceta, setNuevaReceta] = useState({ nombre: "", tipo: "principal", ingredientes: [{ nombre: "", unidad: "g", cantidad: 0 }] });
  const [recetaEditando, setRecetaEditando] = useState(null);

  useEffect(() => {
    const recetasGuardadas = localStorage.getItem("recetas");
    if (recetasGuardadas) {
      setRecetas(JSON.parse(recetasGuardadas));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("recetas", JSON.stringify(recetas));
  }, [recetas]);

  const calcularPedido = () => {
    const ingredientesTotales = {};
    const dias = filtroDia === "semana" ? Object.values(menu) : [menu[filtroDia]];

    dias.forEach(({ principal, acompanamiento, postre }) => {
      [principal, acompanamiento, postre].forEach((rec) => {
        const receta = recetas.find(r => r.nombre === rec);
        if (receta) {
          receta.ingredientes.forEach(({ nombre, unidad, cantidad }) => {
            const clave = `${nombre.trim().toLowerCase()}-${unidad.trim().toLowerCase()}`;
            if (!ingredientesTotales[clave]) ingredientesTotales[clave] = 0;

            const esFruta = receta.tipo === "fruta" || ["banana", "manzana", "naranja", "pera", "mandarina", "ciruela"].includes(receta.nombre.toLowerCase());
            const cantFinal = esFruta ? 1 : cantidad;

            ingredientesTotales[clave] += cantFinal * comensales;
          });
        }
      });
    });

    const lista = Object.entries(ingredientesTotales).map(([clave, cantidad]) => {
      const [nombre, unidad] = clave.split("-");
      if (nombre === "huevo" && unidad === "g") {
        return { nombre: "Huevo", unidad: "unidad", cantidad: Math.ceil(cantidad / 45) };
      }
      return {
        nombre,
        unidad: cantidad >= 1000 ? (unidad === "ml" ? "l" : unidad === "g" ? "kg" : unidad) : unidad,
        cantidad: cantidad >= 1000 ? cantidad / 1000 : cantidad
      };
    });

    setResultado(lista);
  };

  const descargarExcel = () => {
    const ws = XLSX.utils.json_to_sheet(resultado);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Pedido");
    XLSX.writeFile(wb, "pedido_comedor.xlsx");
  };

  const handleModificarIngrediente = (index, field, value) => {
    const receta = recetaEditando !== null ? { ...recetas[recetaEditando] } : { ...nuevaReceta };
    receta.ingredientes[index][field] = field === "cantidad" ? Number(value) : value;
    if (recetaEditando !== null) {
      const nuevas = [...recetas];
      nuevas[recetaEditando] = receta;
      setRecetas(nuevas);
    } else {
      setNuevaReceta(receta);
    }
  };

  const handleAgregarIngrediente = () => {
    if (recetaEditando !== null) {
      const nuevas = [...recetas];
      nuevas[recetaEditando].ingredientes.push({ nombre: "", unidad: "g", cantidad: 0 });
      setRecetas(nuevas);
    } else {
      setNuevaReceta({ ...nuevaReceta, ingredientes: [...nuevaReceta.ingredientes, { nombre: "", unidad: "g", cantidad: 0 }] });
    }
  };

  const handleGuardarReceta = () => {
    if (recetaEditando !== null) {
      setRecetaEditando(null);
    } else {
      setRecetas([...recetas, nuevaReceta]);
      setNuevaReceta({ nombre: "", tipo: "principal", ingredientes: [{ nombre: "", unidad: "g", cantidad: 0 }] });
    }
  };

  const editarReceta = (index) => {
    setRecetaEditando(index);
  };

  const eliminarReceta = (nombre) => {
    setRecetas(recetas.filter(r => r.nombre !== nombre));
    if (recetaEditando !== null) setRecetaEditando(null);
  };

  return <div style={{ padding: 20 }}>Comedor Escolar App</div>;
}
