# Ecommerce Marketplace

## Contexto

El repo actual ya tiene una base backend en NestJS con:

- autenticacion con JWT
- modulo `users`
- MongoDB con Mongoose
- arquitectura en capas `controller -> service -> repository -> dao`

El siguiente paso natural es evolucionar la app hacia un ecommerce simple donde los usuarios puedan publicar productos y otros usuarios puedan interactuar con esas publicaciones.

## Objetivo

Construir una primera version de marketplace donde:

- un usuario autenticado pueda crear productos
- cada producto pertenezca a una categoria hardcodeada
- cada producto permita una o varias opciones de pago hardcodeadas
- cada producto pueda incluir imagenes en formato base64
- los productos activos puedan verse desde endpoints publicos
- solo el creador pueda editar o eliminar su producto
- usuarios autenticados puedan dejar comentarios en un historial comun del producto
- un usuario no autenticado no pueda ver el listado de comentarios
- cualquier usuario autenticado pueda guardar productos en favoritos

## Alcance

Incluido en esta spec:

- categorias hardcodeadas en codigo
- opciones de pago hardcodeadas en codigo
- CRUD de productos con ownership
- carga de imagenes base64 dentro del producto
- endpoints publicos de lectura de productos
- comentarios planos por producto
- favoritos por usuario

Fuera de alcance para esta iteracion:

- carrito
- ordenes de compra
- stock
- checkout real
- pasarela de pagos
- almacenamiento externo de imagenes
- carga de imagenes binarias o multipart
- endpoints especificos para listar categorias
- endpoints especificos para listar opciones de pago
- respuestas anidadas entre comentarios
- ratings o reviews
- busqueda full-text avanzada

## Supuestos

- La lista exacta de categorias y opciones de pago vendra de la "pagina de Panera" mencionada por negocio.
- En esta iteracion esa informacion se hardcodea en el backend y no se administra por base de datos.
- No habra un modulo, controller o service dedicado para categorias u opciones de pago.
- No habra endpoints especificos para consultar categorias u opciones de pago.
- Las imagenes se enviaran como strings base64 dentro del payload JSON.

## Actores

- Visitante: usuario no autenticado que puede ver productos publicos, pero no puede consultar comentarios.
- Usuario autenticado: puede crear productos, comentar y guardar favoritos.
- Creador del producto: ademas de lo anterior, puede editar y eliminar sus propios productos.

## Requerimientos

### Requerimiento 1: Categoria hardcodeada en producto

**User Story:** Como sistema, quiero que la categoria de un producto se valide contra un conjunto hardcodeado de valores permitidos.

#### Acceptance Criteria

1. WHEN un usuario cree o edite un producto THEN el sistema SHALL validar la categoria contra valores hardcodeados en codigo.
2. WHEN un usuario envie una categoria inexistente THEN el sistema SHALL rechazar la operacion con error de validacion.
3. WHEN se consulte un producto THEN el sistema SHALL devolver la categoria seleccionada para ese producto.
4. WHEN la app necesite usar las categorias permitidas THEN el sistema SHALL resolverlas desde enums o constantes hardcodeadas y SHALL NOT depender de base de datos ni de endpoints dedicados.

### Requerimiento 2: Opciones de pago hardcodeadas en producto

**User Story:** Como sistema, quiero que las opciones de pago de un producto se validen contra un conjunto hardcodeado de valores permitidos.

#### Acceptance Criteria

1. WHEN un usuario cree o edite un producto THEN el sistema SHALL exigir al menos una opcion de pago valida.
2. WHEN un usuario envie una opcion de pago inexistente THEN el sistema SHALL rechazar la operacion con error de validacion.
3. WHEN se consulte un producto THEN el sistema SHALL devolver todas las opciones de pago configuradas para ese producto.
4. WHEN la app necesite usar las opciones de pago permitidas THEN el sistema SHALL resolverlas desde enums o constantes hardcodeadas y SHALL NOT depender de base de datos ni de endpoints dedicados.

### Requerimiento 3: Creacion de productos

**User Story:** Como usuario autenticado, quiero publicar un producto para ofrecerlo dentro del marketplace.

#### Acceptance Criteria

1. WHEN un usuario autenticado cree un producto THEN el sistema SHALL registrar la relacion entre el producto y el `userId` del creador tomado del JWT.
2. WHEN se cree un producto THEN el sistema SHALL requerir al menos `name`, `description`, `price`, `category` y `paymentOptions`.
3. WHEN se cree un producto THEN el sistema SHALL validar que `price` sea mayor a cero.
4. WHEN se cree un producto THEN el sistema SHALL crear el producto como visible o disponible segun la politica definida por la implementacion.
5. WHEN un usuario no autenticado intente crear un producto THEN el sistema SHALL rechazar la operacion con `401 Unauthorized`.

### Requerimiento 4: Imagenes base64 en productos

**User Story:** Como usuario autenticado, quiero poder cargar imagenes en mi producto para mostrarlo mejor en la publicacion.

#### Acceptance Criteria

1. WHEN un usuario cree o edite un producto THEN el sistema SHALL permitir enviar una coleccion de imagenes en formato base64 dentro del payload JSON.
2. WHEN se envie una imagen THEN el sistema SHALL validarla como string base64 segun la politica definida por la implementacion.
3. WHEN un producto se consulte THEN el sistema SHALL devolver sus imagenes base64 asociadas.
4. WHEN en el futuro cambie la estrategia de almacenamiento de imagenes THEN esta version SHALL seguir considerando base64 como el formato soportado para esta iteracion.

### Requerimiento 5: Edicion y eliminacion con ownership

**User Story:** Como creador de un producto, quiero poder modificarlo o eliminarlo sin que otros usuarios puedan hacerlo.

#### Acceptance Criteria

1. WHEN el creador del producto edite su producto THEN el sistema SHALL permitir la actualizacion.
2. WHEN un usuario distinto al creador intente editar un producto THEN el sistema SHALL rechazar la operacion con `403 Forbidden`.
3. WHEN el creador del producto elimine su producto THEN el sistema SHALL dejar de exponerlo en los endpoints publicos.
4. WHEN un usuario distinto al creador intente eliminar un producto THEN el sistema SHALL rechazar la operacion con `403 Forbidden`.

### Requerimiento 6: Visualizacion publica de productos

**User Story:** Como visitante, quiero ver los productos disponibles para explorar la oferta del marketplace.

#### Acceptance Criteria

1. WHEN cualquier cliente consulte el listado publico de productos THEN el sistema SHALL devolver solo productos disponibles o activos.
2. WHEN cualquier cliente consulte el detalle publico de un producto THEN el sistema SHALL devolver la informacion publica del producto y los datos publicos basicos de su creador.
3. WHEN un producto haya sido eliminado o desactivado THEN el sistema SHALL ocultarlo del listado publico.
4. WHEN un cliente consulte el listado publico THEN el sistema SHOULD poder filtrar por categoria y por opcion de pago.
5. WHEN un cliente consulte un producto desde endpoints publicos THEN el sistema SHALL NOT incluir el historial de comentarios en esa respuesta.

### Requerimiento 7: Relacion entre usuario y productos creados

**User Story:** Como sistema, quiero conservar la relacion entre usuarios y productos para controlar ownership y trazabilidad.

#### Acceptance Criteria

1. WHEN un producto exista THEN el sistema SHALL guardar una referencia al usuario creador.
2. WHEN se consulte el detalle del producto THEN el sistema SHALL poder resolver datos publicos del creador.
3. WHEN se consulte "mis productos" THEN el sistema SHALL devolver solo los productos creados por el usuario autenticado.

### Requerimiento 8: Historial plano de comentarios por producto

**User Story:** Como usuario autenticado, quiero dejar comentarios en un producto y ver el historial comun de comentarios asociado a ese producto.

#### Acceptance Criteria

1. WHEN un usuario autenticado publique un comentario en un producto activo THEN el sistema SHALL guardar el comentario asociado al producto y al autor.
2. WHEN un usuario autenticado consulte los comentarios de un producto THEN el sistema SHALL devolver el historial de comentarios de ese producto.
3. WHEN un usuario no autenticado intente consultar el listado de comentarios THEN el sistema SHALL rechazar la operacion con `401 Unauthorized`.
4. WHEN un usuario no autenticado intente comentar THEN el sistema SHALL rechazar la operacion con `401 Unauthorized`.
5. WHEN un comentario sea creado THEN el sistema SHALL almacenarlo como comentario asociado al producto y SHALL NOT guardar una relacion `replyTo` o comentario-padre.
6. WHEN multiples usuarios comenten THEN el sistema SHALL permitir comentarios en cualquier orden cronologico sin necesidad de respuesta directa a otro comentario.
7. WHEN un producto no exista o no este disponible THEN el sistema SHALL rechazar nuevos comentarios.

### Requerimiento 9: Favoritos por usuario

**User Story:** Como usuario autenticado, quiero guardar productos en favoritos para volver a verlos despues.

#### Acceptance Criteria

1. WHEN un usuario autenticado marque un producto como favorito THEN el sistema SHALL registrar la relacion entre usuario y producto.
2. WHEN un usuario autenticado quite un favorito THEN el sistema SHALL eliminar esa relacion.
3. WHEN un usuario consulte su lista de favoritos THEN el sistema SHALL devolver solo sus productos favoritos.
4. WHEN un usuario intente guardar dos veces el mismo producto THEN el sistema SHALL evitar duplicados.
5. WHEN un usuario no autenticado intente gestionar favoritos THEN el sistema SHALL rechazar la operacion con `401 Unauthorized`.

### Requerimiento 10: Seguridad y consistencia

**User Story:** Como equipo backend, queremos mantener la coherencia de la app con el esquema de auth y validaciones ya existente.

#### Acceptance Criteria

1. WHEN una operacion requiera identidad de usuario THEN el sistema SHALL reutilizar el mecanismo JWT actual.
2. WHEN una respuesta publique informacion del creador o del autor de un comentario THEN el sistema SHALL excluir datos sensibles como `password`.
3. WHEN una entidad relacionada no exista THEN el sistema SHALL responder con `404 Not Found`.
4. WHEN una request invalida llegue a la API THEN el sistema SHALL devolver errores de validacion consistentes con NestJS.

## Criterios de exito

- La API soporta publicar y leer productos de forma consistente.
- El ownership de productos queda protegido por JWT.
- Las categorias y opciones de pago se validan contra enums o constantes hardcodeadas en codigo.
- Los productos pueden incluir imagenes base64.
- El historial de comentarios queda asociado al producto y solo es visible para usuarios autenticados.
- Cada usuario puede mantener su lista de favoritos sin duplicados.
