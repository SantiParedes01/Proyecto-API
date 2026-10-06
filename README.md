# Proyecto Web 2

API en NestJS con autenticacion JWT, usuarios y un primer modulo de productos para un marketplace.

## Stack

- NestJS
- MongoDB + Mongoose
- Passport JWT
- Class Validator / Class Transformer

## Variables de entorno

Crear un archivo `.env` con estas claves:

```env
MONGODB_URI=mongodb://...
JWT_SECRET=un-secret-seguro
JWT_EXPIRATION=1h
PORT=3004
```

## Instalacion y ejecucion

```bash
npm install
npm run start:dev
```

Build:

```bash
npm run build
```

Tests:

```bash
npm run test
```

## Autenticacion

Flujo basico:

1. Registrar usuario con `POST /auth/register`
2. Loguear con `POST /auth/login`
3. Copiar `access_token`
4. Enviar `Authorization: Bearer <access_token>` en los endpoints protegidos

Ejemplo de header:

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Nota importante:

- `POST /products` requiere JWT
- el `ownerId` no se manda en el body
- `req.user.userId` llega como `string` desde la strategy JWT
- el service de productos convierte ese valor a `Types.ObjectId` antes de persistirlo

## Endpoints actuales

Publicos:

- `POST /auth/register`
- `POST /auth/login`
- `GET /public/products`
- `GET /public/products/:id`

Protegidos con JWT:

- `GET /auth/profile`
- `POST /products`
- `POST /users`
- `GET /users`
- `GET /users/:id`
- `PUT /users/:id`
- `DELETE /users/:id`

## Crear producto

`POST /products`

Header requerido:

```http
Authorization: Bearer <access_token>
Content-Type: application/json
```

Body de ejemplo:

```json
{
  "name": "Sourdough Bread",
  "description": "Pan de masa madre horneado en el dia",
  "price": 18.5,
  "category": "bread",
  "paymentOptions": ["cash", "mercado_pago"],
  "imagesBase64": [
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUA"
  ]
}
```

Categorias disponibles:

- `bread`
- `pastry`
- `sandwich`
- `salad`
- `drink`
- `dessert`

Opciones de pago disponibles:

- `cash`
- `debit_card`
- `credit_card`
- `bank_transfer`
- `mercado_pago`

## Catalogo publico

`GET /public/products` lista solo productos activos.

Filtros soportados por query string:

- `category`
- `paymentOption`
- `ownerId`
- `minPrice`
- `maxPrice`

Ejemplos:

```http
GET /public/products?category=bread
GET /public/products?paymentOption=mercado_pago
GET /public/products?ownerId=6a2320b421953f49f18305ae
GET /public/products?minPrice=10&maxPrice=30
```

## Documentacion del repo

- `clase-4-pasos.md`: de CRUD a auth con JWT
- `clase-5-pasos.md`: de auth a marketplace con products
- `clase-arquitectura-users-auth.md`: explicacion de arquitectura y auth
