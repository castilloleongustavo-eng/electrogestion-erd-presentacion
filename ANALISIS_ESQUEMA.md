# Análisis del esquema real

Origen: INFORMATION_SCHEMA de electrogestion_db (MariaDB/MySQL local).

23 tablas, 174 columnas y 30 FK declaradas. Todas las FK individuales admiten 1:N desde el destino hacia el origen. Dos FK permiten NULL. No se dibujan relaciones inferidas por nombres.

## Tablas

| Tabla | Columnas |
|---|---:|
| asiento_contable | 7 |
| asiento_detalle | 6 |
| bodega | 4 |
| categoria | 4 |
| cliente | 11 |
| cobro | 7 |
| cotizacion | 11 |
| cotizacion_detalle | 6 |
| cuenta_contable | 6 |
| despacho | 6 |
| despacho_detalle | 5 |
| empresa | 10 |
| factura | 11 |
| factura_detalle | 10 |
| impuesto_iva | 5 |
| inventario | 6 |
| localizacion | 7 |
| pedido | 11 |
| pedido_detalle | 10 |
| producto | 14 |
| sitio | 7 |
| subcategoria | 4 |
| vendedor | 6 |

## Relaciones declaradas

La dirección de esta tabla es origen (FK) → destino (clave referenciada). La cardinalidad 1:N se lee en sentido destino → origen.

| Origen | Campos FK | Destino | Campos referenciados | FK opcional |
|---|---|---|---|---|
| asiento_detalle | id_asiento | asiento_contable | id_asiento | False |
| asiento_detalle | id_cuenta | cuenta_contable | id_cuenta | False |
| bodega | id_sitio | sitio | id_sitio | False |
| categoria | id_cuenta_contable | cuenta_contable | id_cuenta | True |
| cliente | id_cuenta_contable | cuenta_contable | id_cuenta | False |
| cliente | id_vendedor | vendedor | id_vendedor | False |
| cobro | id_factura | factura | id_factura | False |
| cotizacion | id_cliente | cliente | id_cliente | False |
| cotizacion | id_vendedor | vendedor | id_vendedor | False |
| cotizacion_detalle | id_cotizacion | cotizacion | id_cotizacion | False |
| cotizacion_detalle | id_producto | producto | id_producto | False |
| despacho | id_factura | factura | id_factura | False |
| despacho_detalle | id_despacho | despacho | id_despacho | False |
| despacho_detalle | id_producto | producto | id_producto | False |
| despacho_detalle | id_localizacion | localizacion | id_localizacion | False |
| factura | id_pedido | pedido | id_pedido | False |
| factura_detalle | id_factura | factura | id_factura | False |
| factura_detalle | id_producto | producto | id_producto | False |
| factura_detalle | id_localizacion | localizacion | id_localizacion | False |
| inventario | id_producto | producto | id_producto | False |
| inventario | id_localizacion | localizacion | id_localizacion | False |
| localizacion | id_bodega | bodega | id_bodega | False |
| pedido | id_cotizacion | cotizacion | id_cotizacion | False |
| pedido_detalle | id_pedido | pedido | id_pedido | False |
| pedido_detalle | id_producto | producto | id_producto | False |
| producto | id_subcategoria | subcategoria | id_subcategoria | False |
| producto | id_cuenta_contable | cuenta_contable | id_cuenta | True |
| producto | id_iva | impuesto_iva | id_iva | False |
| sitio | id_empresa | empresa | id_empresa | False |
| subcategoria | id_categoria | categoria | id_categoria | False |

## Tabla intermedia verificada

inventario vincula producto y localizacion mediante dos FK obligatorias. El índice único (id_producto, id_localizacion) evita duplicar la combinación; sustenta una asociación N:M entre ambos extremos. No se añade una FK directa ficticia.

## Acceso local

Se reutilizó la conexión explícita de SQLTools. La cuenta disponible es root; se limitaron las sesiones a transacciones de lectura y las consultas a INFORMATION_SCHEMA. No se cambiaron sus privilegios ni se crearon usuarios. La configuración .env permite cambiar a una cuenta restringida.

Los SQL locales son una captura de referencia y no se ejecutaron. No se accedió al almacén protegido de DBeaver ni se verificó su diagrama visual. El modelo entregado se deriva de la base activa.
