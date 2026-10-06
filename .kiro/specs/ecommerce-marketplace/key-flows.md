# Key Flows - APIs y Base de Datos

## Objetivo

Este documento describe los flujos principales del ecommerce usando principalmente diagramas Mermaid.

## Convenciones

- `Cliente`: consumidor de la API
- `API`: controllers + services del backend
- `DB`: colecciones MongoDB
- `JWT`: autenticacion requerida

## Vista general

```mermaid
flowchart TD
    A[Cliente] --> B{Que quiere hacer?}
    B --> C[Ver productos publicos]
    B --> D[Crear o editar producto]
    B --> E[Comentar producto]
    B --> F[Gestionar favoritos]

    C --> C1[GET /public/products]
    C --> C2[GET /public/products/:id]

    D --> D1[POST /products]
    D --> D2[PATCH /products/:id]
    D --> D3[DELETE /products/:id]

    E --> E1[POST /products/:id/comments]
    E --> E2[GET /products/:id/comments]

    F --> F1[POST /favorites/:productId]
    F --> F2[DELETE /favorites/:productId]
    F --> F3[GET /favorites/me]
```

## Flujo 1: Crear producto

- Endpoint: `POST /products`
- Auth: `JWT requerido`
- Escribe en: `products`

```mermaid
flowchart TD
    A[Cliente autenticado] --> B[POST /products]
    B --> C[API recibe payload]
    C --> D[Validar JWT]
    D -->|Invalido| E[401 Unauthorized]
    D -->|Valido| F[Validar DTO]
    F -->|Error| G[400 Bad Request]
    F -->|OK| H[Validar category contra enum]
    H -->|Error| G
    H -->|OK| I[Validar paymentOptions contra enum]
    I -->|Error| G
    I -->|OK| J[Validar imagesBase64]
    J -->|Error| G
    J -->|OK| K[Construir product con ownerId del JWT]
    K --> L[(products)]
    L --> M[Guardar documento]
    M --> N[201 Created]
```

## Flujo 2: Listado publico de productos

- Endpoint: `GET /public/products`
- Auth: `No requerido`
- Lee de: `products`

```mermaid
flowchart TD
    A[Cliente] --> B[GET /public/products]
    B --> C[API recibe filtros opcionales]
    C --> D[Validar query params]
    D -->|Error| E[400 Bad Request]
    D -->|OK| F[Buscar products con isActive true]
    F --> G[(products)]
    G --> H[Aplicar filtros category paymentOption ownerId precio]
    H --> I[Excluir comentarios]
    I --> J[200 OK con lista publica]
```

## Flujo 3: Detalle publico de producto

- Endpoint: `GET /public/products/:id`
- Auth: `No requerido`
- Lee de: `products`, `users`

```mermaid
flowchart TD
    A[Cliente] --> B[GET /public/products/:id]
    B --> C[Buscar producto]
    C --> D[(products)]
    D --> E{Existe y esta activo?}
    E -->|No| F[404 Not Found]
    E -->|Si| G[Resolver ownerId]
    G --> H[(users)]
    H --> I[Armar respuesta publica]
    I --> J[Excluir comentarios]
    J --> K[200 OK]
```

## Flujo 4: Editar o eliminar producto propio

- Endpoints: `PATCH /products/:id`, `DELETE /products/:id`
- Auth: `JWT requerido`
- Lee y escribe en: `products`

```mermaid
flowchart TD
    A[Cliente autenticado] --> B{PATCH o DELETE}
    B --> C[Validar JWT]
    C -->|Invalido| D[401 Unauthorized]
    C -->|Valido| E[Buscar producto por id]
    E --> F[(products)]
    F --> G{Existe?}
    G -->|No| H[404 Not Found]
    G -->|Si| I{ownerId coincide con JWT?}
    I -->|No| J[403 Forbidden]
    I -->|Si y PATCH| K[Revalidar campos editables]
    K -->|Error| L[400 Bad Request]
    K -->|OK| M[Actualizar product]
    M --> F
    M --> N[200 OK]
    I -->|Si y DELETE| O[Marcar isActive false]
    O --> F
    O --> P[200 OK o 204 No Content]
```

## Flujo 5: Crear comentario en producto

- Endpoint: `POST /products/:id/comments`
- Auth: `JWT requerido`
- Lee de: `products`
- Escribe en: `product_comments`

```mermaid
flowchart TD
    A[Cliente autenticado] --> B[POST /products/:id/comments]
    B --> C[Validar JWT]
    C -->|Invalido| D[401 Unauthorized]
    C -->|Valido| E[Validar DTO del comentario]
    E -->|Error| F[400 Bad Request]
    E -->|OK| G[Buscar producto]
    G --> H[(products)]
    H --> I{Existe y esta activo?}
    I -->|No| J[404 Not Found]
    I -->|Si| K[Crear comment con productId y authorId]
    K --> L[(product_comments)]
    L --> M[Guardar comentario]
    M --> N[201 Created]
```

## Flujo 6: Ver comentarios de producto

- Endpoint: `GET /products/:id/comments`
- Auth: `JWT requerido`
- Lee de: `products`, `product_comments`, `users`

```mermaid
flowchart TD
    A[Cliente] --> B[GET /products/:id/comments]
    B --> C[Validar JWT]
    C -->|Invalido| D[401 Unauthorized]
    C -->|Valido| E[Buscar producto]
    E --> F[(products)]
    F --> G{Existe?}
    G -->|No| H[404 Not Found]
    G -->|Si| I[Buscar comentarios por productId]
    I --> J[(product_comments)]
    J --> K[Resolver autores publicos]
    K --> L[(users)]
    L --> M[Ordenar historial plano]
    M --> N[200 OK]
```

## Flujo 7: Agregar favorito

- Endpoint: `POST /favorites/:productId`
- Auth: `JWT requerido`
- Lee de: `products`, `favorites`
- Escribe en: `favorites`

```mermaid
flowchart TD
    A[Cliente autenticado] --> B[POST /favorites/:productId]
    B --> C[Validar JWT]
    C -->|Invalido| D[401 Unauthorized]
    C -->|Valido| E[Buscar producto]
    E --> F[(products)]
    F --> G{Existe?}
    G -->|No| H[404 Not Found]
    G -->|Si| I[Buscar favorite userId + productId]
    I --> J[(favorites)]
    J --> K{Ya existe?}
    K -->|Si| L[409 Conflict o respuesta idempotente]
    K -->|No| M[Crear favorite]
    M --> J
    M --> N[201 Created]
```

## Flujo 8: Quitar favorito

- Endpoint: `DELETE /favorites/:productId`
- Auth: `JWT requerido`
- Lee y escribe en: `favorites`

```mermaid
flowchart TD
    A[Cliente autenticado] --> B[DELETE /favorites/:productId]
    B --> C[Validar JWT]
    C -->|Invalido| D[401 Unauthorized]
    C -->|Valido| E[Buscar favorite userId + productId]
    E --> F[(favorites)]
    F --> G{Existe?}
    G -->|No| H[200 OK o 204 No Content]
    G -->|Si| I[Eliminar favorite]
    I --> F
    I --> J[200 OK o 204 No Content]
```

## Flujo 9: Ver mis favoritos

- Endpoint: `GET /favorites/me`
- Auth: `JWT requerido`
- Lee de: `favorites`, `products`

```mermaid
flowchart TD
    A[Cliente autenticado] --> B[GET /favorites/me]
    B --> C[Validar JWT]
    C -->|Invalido| D[401 Unauthorized]
    C -->|Valido| E[Buscar favorites por userId]
    E --> F[(favorites)]
    F --> G[Resolver products asociados]
    G --> H[(products)]
    H --> I[Armar lista final]
    I --> J[200 OK]
```

## Resumen de visibilidad

```mermaid
flowchart TD
    A{Usuario logueado?}
    A -->|No| B[Puede ver productos publicos]
    A -->|No| C[No puede ver comentarios]
    A -->|No| D[No puede comentar]
    A -->|No| E[No puede usar favoritos]

    A -->|Si| F[Puede crear productos]
    A -->|Si| G[Puede ver comentarios]
    A -->|Si| H[Puede comentar]
    A -->|Si| I[Puede usar favoritos]
    A -->|Si| J[Puede editar o eliminar solo sus productos]
```
