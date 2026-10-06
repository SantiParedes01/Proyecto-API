# Tasks - Ecommerce Marketplace

## Enfoque Agile

El backlog se organiza por checkpoints incrementales.

Cada checkpoint debe cumplir estas reglas:

- dejar la app en estado funcional
- agregar una capacidad visible nueva
- poder probarse de punta a punta
- evitar ramas largas con muchas piezas incompletas
- cerrar con un checkpoint claro antes de avanzar al siguiente

## Checkpoint 0 - Base estable actual

Objetivo:

- conservar funcionando `users/auth` como baseline

Salida esperada:

- login, register y JWT siguen operativos
- no se rompe nada existente mientras arranca `products`

## Checkpoint 1 - Publicacion minima de productos

Objetivo:

- lograr la primera vertical slice del ecommerce

Capacidad nueva:

- un usuario autenticado puede publicar un producto
- cualquier visitante puede verlo en listado y detalle publico

Tasks:

- [ ] 1. Crear `ProductsModule`
  - Registrar `ProductsModule` en `AppModule`.
  - Mantener el patron `controller -> service -> repository -> dao`.

- [ ] 2. Definir categorias y opciones de pago hardcodeadas
  - Crear enums o constantes para categorias.
  - Crear enums o constantes para opciones de pago.
  - Ubicar estas definiciones dentro de `src/products/`.
  - Reutilizar estas definiciones en DTOs y servicios.

- [ ] 3. Modelar la entidad `Product`
  - Crear `product.schema.ts` con `ownerId`, `name`, `description`, `price`, `category`, `paymentOptions`, `imagesBase64` e `isActive`.
  - Crear DTOs de alta y respuesta.
  - Crear DAO, repository y service base.

- [ ] 4. Implementar `POST /products`
  - Requerir JWT.
  - Completar `ownerId` con el `userId` del token.
  - Validar `price`, `category`, `paymentOptions` e `imagesBase64`.

- [ ] 5. Implementar lectura publica minima
  - Crear `GET /public/products`.
  - Crear `GET /public/products/:id`.
  - Devolver solo productos activos.

- [ ] 6. Cerrar checkpoint con prueba minima
  - Verificar que un usuario cree un producto.
  - Verificar que luego pueda verse publicamente.

Resultado del checkpoint:

- la app ya funciona como catalogo minimo publicable

## Checkpoint 2 - Gestion del producto por su creador

Objetivo:

- completar el ciclo de vida basico de un producto

Capacidad nueva:

- el creador puede listar, editar y eliminar sus productos

Tasks:

- [ ] 7. Implementar `GET /products/mine`
  - Filtrar por `ownerId = userIdDelJWT`.

- [ ] 8. Implementar `PATCH /products/:id`
  - Revalidar campos editables.
  - Mantener validacion de enums y base64.

- [ ] 9. Implementar `DELETE /products/:id`
  - Aplicar baja logica con `isActive = false`.

- [ ] 10. Implementar ownership
  - Verificar que solo el owner pueda editar o eliminar.
  - Responder `403` cuando corresponda.

- [ ] 11. Agregar filtros publicos basicos
  - Soportar `category`, `paymentOption`, `ownerId`, `minPrice` y `maxPrice`.

- [ ] 12. Cerrar checkpoint con prueba funcional
  - Crear producto.
  - Editarlo como owner.
  - Bloquear edicion de otro usuario.
  - Eliminarlo y confirmar que desaparece del listado publico.

Resultado del checkpoint:

- la app ya funciona como publicador de productos con ownership

## Checkpoint 3 - Comentarios autenticados por producto

Objetivo:

- incorporar interaccion social simple sin romper el flujo publico

Capacidad nueva:

- usuarios autenticados pueden comentar productos
- los comentarios solo son visibles para usuarios autenticados

Tasks:

- [ ] 13. Modelar `ProductComment`
  - Crear `product-comment.schema.ts`.
  - Crear DAO, repository y service.

- [ ] 14. Implementar `POST /products/:id/comments`
  - Requerir JWT.
  - Validar que el producto exista y este activo.
  - Guardar `productId` y `authorId`.

- [ ] 15. Implementar `GET /products/:id/comments`
  - Requerir JWT.
  - Devolver historial plano por `productId`.
  - Definir orden del historial.

- [ ] 16. Mantener aislamiento con endpoints publicos
  - Confirmar que `GET /public/products` y `GET /public/products/:id` no devuelven comentarios.
  - Confirmar que un no autenticado no puede leer comentarios.

- [ ] 17. Cerrar checkpoint con prueba funcional
  - Crear producto.
  - Comentar con un usuario autenticado.
  - Ver comentarios con otro usuario autenticado.
  - Bloquear acceso a comentarios sin JWT.

Resultado del checkpoint:

- la app ya funciona con conversacion plana por producto

## Checkpoint 4 - Favoritos por usuario

Objetivo:

- agregar personalizacion sin afectar el catalogo publico

Capacidad nueva:

- cada usuario puede guardar y consultar sus favoritos

Tasks:

- [ ] 18. Modelar `Favorite`
  - Crear `favorite.schema.ts`.
  - Agregar indice unico por `userId + productId`.

- [ ] 19. Implementar `POST /favorites/:productId`
  - Requerir JWT.
  - Validar que el producto exista.
  - Evitar duplicados.

- [ ] 20. Implementar `DELETE /favorites/:productId`
  - Requerir JWT.
  - Quitar favorito del usuario actual.

- [ ] 21. Implementar `GET /favorites/me`
  - Requerir JWT.
  - Resolver productos favoritos del usuario.

- [ ] 22. Cerrar checkpoint con prueba funcional
  - Guardar favorito.
  - Consultar favoritos.
  - Quitar favorito.

Resultado del checkpoint:

- la app ya funciona con favoritos por usuario

## Checkpoint 5 - Hardening, DX y calidad

Objetivo:

- mejorar mantenibilidad y confianza sin cambiar el alcance funcional

Capacidad nueva:

- mejor experiencia de desarrollo y mayor estabilidad del backend

Tasks:

- [ ] 23. Mejorar ergonomia interna
  - Crear decorator tipo `CurrentUser`.
  - Crear helpers para ownership y carga de entidades.
  - Uniformar `404`, `401` y `403`.

- [ ] 24. Completar tests unitarios
  - Validacion de enums de categoria y pago.
  - Validacion de imagenes base64.
  - Ownership en update y delete.

- [ ] 25. Completar tests e2e por flujo
  - Creacion de producto.
  - Listado publico.
  - Comentarios visibles solo con JWT.
  - Favoritos duplicados.

- [ ] 26. Documentar uso de la API
  - Actualizar `README.md` o crear guia de endpoints.
  - Documentar payloads de productos, comentarios y favoritos.
  - Documentar valores permitidos de categoria y pago.
  - Documentar limites de `imagesBase64`.

- [ ] 27. Cerrar checkpoint con smoke test integral
  - Registrar usuario.
  - Crear producto.
  - Verlo publicamente.
  - Comentar.
  - Guardarlo en favoritos.

Resultado del checkpoint:

- la app queda funcional, documentada y con base mas segura para seguir iterando

## Secuencia recomendada de trabajo

1. Terminar un checkpoint completo antes de abrir el siguiente.
2. Priorizar siempre un flujo vertical usable por sobre completar todas las capas de una feature incompleta.
3. Hacer demo o prueba manual al cierre de cada checkpoint.
4. Si una tarea tecnica no agrega valor visible inmediato, moverla al checkpoint de hardening salvo que bloquee el flujo actual.
