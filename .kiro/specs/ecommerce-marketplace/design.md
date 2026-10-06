# Design - Ecommerce Marketplace

## Resumen

La implementacion propuesta extiende la arquitectura actual del repo sin romper su enfoque por capas:

- `controller`: expone endpoints HTTP
- `service`: aplica reglas de negocio
- `repository`: abstrae la persistencia
- `dao`: interactua con Mongoose

La solucion se apoya en los modulos existentes de autenticacion y usuarios, y agrega una pieza nueva:

- un modulo `products` para productos, comentarios y favoritos

Las categorias y opciones de pago no tendran modulo ni endpoints dedicados. Se modelan como enums o constantes hardcodeadas usadas directamente por DTOs y servicios de `products`.

## Estado actual del repo

Hoy el proyecto ya resuelve:

- registro y login con JWT
- perfil autenticado
- persistencia de usuarios en MongoDB
- separacion `controller -> service -> repository -> dao`

Todavia no existe:

- productos
- ownership entre usuarios y productos
- comentarios por producto
- favoritos

## Objetivos tecnicos

- Reutilizar el JWT actual para identificar al usuario.
- Mantener la arquitectura por capas ya enseñada en `clase-4`.
- Mantener categorias y opciones de pago hardcodeadas, sin consultas a base de datos.
- No crear endpoints especificos para categorias ni para opciones de pago.
- Diferenciar endpoints publicos de endpoints autenticados.
- Soportar imagenes base64 dentro del payload JSON del producto.

## Arquitectura propuesta

### `ProductsModule`

Responsabilidad:

- CRUD de productos
- listado publico y detalle publico
- historial plano de comentarios por producto
- favoritos por usuario
- validacion de categorias y opciones de pago hardcodeadas

Propuesta de estructura:

```text
src/products/
├── constants/
│   ├── product-category.enum.ts
│   └── payment-option.enum.ts
├── controllers/
│   ├── products.controller.ts
│   ├── public-products.controller.ts
│   ├── product-comments.controller.ts
│   └── favorites.controller.ts
├── dao/
│   ├── products.mongoose.dao.ts
│   ├── product-comments.mongoose.dao.ts
│   └── favorites.mongoose.dao.ts
├── dto/
│   ├── create-product.dto.ts
│   ├── update-product.dto.ts
│   ├── list-products-query.dto.ts
│   ├── create-comment.dto.ts
│   ├── product-response.dto.ts
│   ├── public-product-response.dto.ts
│   ├── product-comment-response.dto.ts
│   └── favorite-response.dto.ts
├── repositories/
│   ├── products.repository.ts
│   ├── product-comments.repository.ts
│   └── favorites.repository.ts
├── schemas/
│   ├── product.schema.ts
│   ├── product-comment.schema.ts
│   └── favorite.schema.ts
├── services/
│   ├── products.service.ts
│   ├── product-comments.service.ts
│   └── favorites.service.ts
└── products.module.ts
```

Decision importante:

- Las categorias y opciones de pago viven dentro de `src/products/constants/` o una ubicacion equivalente del mismo modulo.
- No se crea `CatalogModule`, `CatalogService` ni controllers dedicados.

## Valores hardcodeados

La fuente de verdad para categorias y medios de pago vive en codigo, por ejemplo:

```ts
export enum ProductCategory {
  BREAD = 'bread',
  PASTRY = 'pastry',
}

export enum PaymentOption {
  CASH = 'cash',
  DEBIT = 'debit',
  CREDIT = 'credit',
}
```

Uso recomendado:

- `@IsEnum(ProductCategory)` para `category`
- validacion de `paymentOptions` como array de valores del enum `PaymentOption`
- documentar los valores permitidos en README o en la documentacion de la API

## Modelo de dominio

### Product

Representa una publicacion del marketplace.

Campos propuestos:

- `_id`
- `ownerId: ObjectId` referencia a `User`
- `name: string`
- `description: string`
- `price: number`
- `category: string`
- `paymentOptions: string[]`
- `imagesBase64: string[]`
- `isActive: boolean`
- `createdAt`
- `updatedAt`

Decisiones:

- `ownerId` es la relacion central entre usuario y producto.
- `category` y `paymentOptions` se validan contra enums o constantes hardcodeadas.
- `imagesBase64` guarda las imagenes de esta primera version directamente en el documento.
- `isActive` permite una baja logica simple para ocultar productos sin perder trazabilidad.

### ProductComment

Representa un comentario publicado por un usuario dentro del historial comun de un producto.

Campos propuestos:

- `_id`
- `productId: ObjectId`
- `authorId: ObjectId`
- `message: string`
- `createdAt`
- `updatedAt`

Decisiones:

- El comentario no tiene `replyTo`, `parentId` ni ningun vinculo con otro comentario.
- El historial es plano y se recupera por `productId`.
- Cualquier usuario autenticado puede agregar comentarios, incluido el creador del producto.

### Favorite

Representa el guardado de un producto por parte de un usuario.

Campos propuestos:

- `_id`
- `userId: ObjectId`
- `productId: ObjectId`
- `createdAt`

Decisiones:

- Usar coleccion separada evita duplicados y simplifica la consulta de favoritos por usuario.
- Se recomienda un indice unico compuesto por `userId + productId`.

## Endpoints propuestos

### Productos autenticados

- `POST /products`
- `GET /products/mine`
- `PATCH /products/:id`
- `DELETE /products/:id`

Reglas:

- requieren JWT
- `PATCH` y `DELETE` solo para el owner

### Productos publicos

- `GET /public/products`
- `GET /public/products/:id`

Filtros recomendados para listado:

- `category`
- `paymentOption`
- `ownerId`
- `minPrice`
- `maxPrice`

Decision importante:

- estos endpoints no devuelven el historial de comentarios

### Comentarios

- `POST /products/:id/comments`
- `GET /products/:id/comments`

Reglas:

- ambos requieren JWT
- el listado de comentarios no es publico
- el historial se devuelve como una lista plana asociada al producto

### Favoritos

- `POST /favorites/:productId`
- `DELETE /favorites/:productId`
- `GET /favorites/me`

Reglas:

- todos requieren JWT

## Flujo de autorizacion

### Crear producto

1. `JwtAuthGuard` valida token.
2. El controller toma `req.user.userId`.
3. El service valida categoria y opciones de pago contra enums o constantes hardcodeadas.
4. El service valida las imagenes base64 si fueron enviadas.
5. El service persiste el producto con `ownerId = req.user.userId`.

### Editar o eliminar producto

1. `JwtAuthGuard` valida token.
2. El service busca el producto por id.
3. El service compara `product.ownerId` con `req.user.userId`.
4. Si no coincide, devuelve `403`.
5. Si coincide, aplica actualizacion o baja logica.

### Consultar comentarios

1. `JwtAuthGuard` valida token.
2. El service verifica que el producto exista y este visible para comentarios.
3. El service devuelve el historial plano de comentarios asociado a `productId`.

## Estrategia de validacion

### DTOs

`CreateProductDto`

- `name`: string, minimo 3, maximo 120
- `description`: string, minimo 10, maximo 2000
- `price`: number, mayor a 0
- `category`: valor valido de `ProductCategory`
- `paymentOptions`: array no vacio, sin duplicados, todos validos segun `PaymentOption`
- `imagesBase64`: array opcional de strings base64

`UpdateProductDto`

- version parcial de `CreateProductDto`

`CreateCommentDto`

- `message`: string, minimo 3, maximo razonable

### Respuestas

Las respuestas publicas de productos deben:

- excluir datos sensibles del usuario
- incluir el creador del producto en formato resumido
- incluir las imagenes base64 del producto
- no incluir comentarios en endpoints publicos

Las respuestas de comentarios deben:

- excluir datos sensibles del autor
- devolver una lista plana de comentarios del producto

## Relacion con `users`

No hace falta modificar el schema base de `User` para esta iteracion.

La relacion se resuelve desde:

- `Product.ownerId`
- `ProductComment.authorId`
- `Favorite.userId`

Opcional para una segunda iteracion:

- virtual populate de productos creados por usuario
- contador de productos por usuario

## Decisiones de persistencia

### Por que no guardar favoritos dentro del usuario

- crece sin limite dentro de un solo documento
- complica validacion de duplicados
- hace mas costosa la consulta cruzada por producto

### Por que no embebemos comentarios dentro del producto

- el producto puede crecer demasiado si tiene muchos comentarios
- separar colecciones facilita paginacion y consultas futuras
- mantener una coleccion propia simplifica la restriccion de visibilidad por endpoint

### Por que guardar imagenes base64 en el producto en esta version

- simplifica la primera iteracion
- evita introducir almacenamiento externo demasiado pronto
- permite probar rapido el flujo completo de publicacion

## Riesgos y mitigaciones

### Riesgo 1: listas hardcodeadas inconsistentes

Mitigacion:

- usar una unica definicion por enum o constante
- no repetir strings literales en distintos archivos

### Riesgo 2: payloads muy pesados por imagenes base64

Mitigacion:

- limitar cantidad de imagenes por producto
- limitar tamano maximo por imagen
- documentar claramente los limites del endpoint

### Riesgo 3: borrado de productos rompe favoritos o comentarios

Mitigacion:

- usar `isActive = false` como baja logica inicial
- excluir productos inactivos de endpoints publicos

## Testing recomendado

- unit tests para validacion de enums de categoria y pago
- unit tests para validacion de imagenes base64
- unit tests para ownership en update y delete
- e2e tests de flujo publico y autenticado
- e2e tests para comentarios visibles solo con JWT
- e2e tests para favoritos duplicados

## Estrategia de implementacion incremental

La implementacion debe avanzar por slices verticales y no por acumulacion de piezas aisladas.

Principios:

- cada etapa debe dejar la app corriendo
- cada etapa debe agregar una capacidad usable
- cada etapa debe poder probarse manualmente o por e2e
- las tareas tecnicas de soporte deben entrar solo cuando mejoran o destraban un flujo real

Checkpoints sugeridos:

1. Publicacion minima de productos
   - `ProductsModule`
   - enums hardcodeados
   - `Product`
   - `POST /products`
   - `GET /public/products`
   - `GET /public/products/:id`
   - salida: ya existe un marketplace minimo publicable
2. Gestion del producto por su creador
   - `GET /products/mine`
   - `PATCH /products/:id`
   - `DELETE /products/:id`
   - ownership
   - filtros publicos
   - salida: el ciclo de vida base del producto queda completo
3. Comentarios autenticados
   - `ProductComment`
   - `POST /products/:id/comments`
   - `GET /products/:id/comments`
   - restriccion de visibilidad con JWT
   - salida: la conversacion por producto queda operativa
4. Favoritos por usuario
   - `Favorite`
   - alta, baja y listado de favoritos
   - salida: la experiencia personalizada ya existe
5. Hardening y DX
   - decorators
   - helpers compartidos
   - tests
   - documentacion
   - salida: la base queda lista para siguientes iteraciones
