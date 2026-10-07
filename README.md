# Proyecto-API

API REST para un marketplace de productos gastronómicos (pan, pastelería, sándwiches, ensaladas, bebidas y postres), desarrollada con NestJS como proyecto de la materia Programación Web 2.

Los usuarios se registran, inician sesión con JWT, publican productos, los marcan como favoritos y dejan comentarios. El catálogo público se puede consultar sin autenticación.

## Tecnologías

- NestJS 11 (TypeScript)
- MongoDB + Mongoose
- Autenticación con Passport JWT
- bcrypt para el hash de contraseñas
- class-validator y class-transformer para validar los datos de entrada
- Jest para los tests

## Arquitectura

Cada módulo sigue las mismas capas: **Controller → Service → Repository → DAO (Mongoose)**.

```
src/
├── common/          # Decorador @CurrentUser
├── users/           # Registro, login, perfil y CRUD de usuarios
├── products/        # Productos, catálogo público, favoritos y comentarios
├── notifications/   # Notificaciones por usuario (ver "Pendiente")
├── app.module.ts
└── main.ts
```

## Requisitos

- Node.js 18 o superior
- Una base de datos MongoDB (local o en MongoDB Atlas)

## Instalación

```bash
git clone https://github.com/SantiParedes01/Proyecto-API.git
cd Proyecto-API
npm install
```

## Variables de entorno

Copiá `.env.example` como `.env` y completá los valores:

```env
MONGODB_URI=mongodb+srv://<usuario>:<password>@<cluster>.mongodb.net/proyecto-web-2
JWT_SECRET=un-secret-seguro
JWT_EXPIRATION=1h
PORT=3000
```

| Variable | Descripción |
| --- | --- |
| `MONGODB_URI` | Cadena de conexión a MongoDB |
| `JWT_SECRET` | Clave para firmar los tokens (obligatoria) |
| `JWT_EXPIRATION` | Duración del token (por defecto `1h`) |
| `PORT` | Puerto del servidor (por defecto `3000`) |

## Ejecución

```bash
npm run start:dev    # desarrollo, con recarga automática
npm run build        # compilar
npm run start:prod   # producción (después de compilar)
npm run test         # tests unitarios
npm run test:e2e     # tests end-to-end
npm run lint         # revisar el código
```

## Autenticación

1. Registrarse con `POST /auth/register`.
2. Iniciar sesión con `POST /auth/login` y copiar el `access_token`.
3. Enviar el token en los endpoints protegidos:

```http
Authorization: Bearer <access_token>
```

Registro:

```json
{
  "name": "Ana",
  "surname": "Pérez",
  "mail": "ana@mail.com",
  "password": "Clave123!"
}
```

La contraseña debe tener al menos 8 caracteres, con mayúscula, minúscula, número y un carácter especial (`@$!%*?&`). Se guarda con hash (bcrypt).

Login:

```json
{
  "mail": "ana@mail.com",
  "password": "Clave123!"
}
```

La respuesta incluye `access_token` y los datos del usuario (`id`, `name`, `surname`, `email`, `role`). Los roles disponibles son `user` (por defecto) y `admin`.

## Endpoints

### Públicos

| Método | Ruta | Descripción |
| --- | --- | --- |
| POST | `/auth/register` | Registrar un usuario |
| POST | `/auth/login` | Iniciar sesión |
| GET | `/public/products` | Listar productos activos, con filtros |
| GET | `/public/products/:id` | Detalle de un producto, con nombre del vendedor |

Filtros de `GET /public/products` (query string): `category`, `paymentOption`, `ownerId`, `minPrice`, `maxPrice`.

```http
GET /public/products?category=bread
GET /public/products?paymentOption=mercado_pago&minPrice=10&maxPrice=30
```

### Protegidos (requieren JWT)

| Método | Ruta | Descripción |
| --- | --- | --- |
| GET | `/auth/profile` | Perfil del usuario autenticado |
| POST | `/products` | Crear un producto (el dueño es el usuario del token) |
| GET | `/products/mine` | Listar mis productos |
| PATCH | `/products/:id` | Editar un producto (solo su dueño) |
| DELETE | `/products/:id` | Eliminar un producto (solo su dueño; baja lógica) |
| POST | `/favorites/:productId` | Agregar un producto a favoritos |
| GET | `/favorites/me` | Listar mis favoritos |
| DELETE | `/favorites/:productId` | Quitar un producto de favoritos |
| POST | `/products/:id/comments` | Comentar un producto |
| GET | `/products/:id/comments` | Listar los comentarios de un producto |
| POST, GET | `/users` | Crear un usuario / listar usuarios |
| GET, PUT, DELETE | `/users/:id` | Ver, editar o eliminar un usuario |

## Crear un producto

`POST /products`

```http
Authorization: Bearer <access_token>
Content-Type: application/json
```

```json
{
  "name": "Pan de masa madre",
  "description": "Pan de masa madre horneado en el día",
  "price": 18.5,
  "category": "bread",
  "paymentOptions": ["cash", "mercado_pago"],
  "imagesBase64": ["data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUA"]
}
```

- `name`: mínimo 3 caracteres. `description`: mínimo 10 caracteres.
- `price`: mayor a 0, hasta 2 decimales.
- `imagesBase64`: opcional, hasta 5 imágenes.

Categorías (`category`): `bread`, `pastry`, `sandwich`, `salad`, `drink`, `dessert`.

Medios de pago (`paymentOptions`): `cash`, `debit_card`, `credit_card`, `bank_transfer`, `mercado_pago`.

## Comentarios

`POST /products/:id/comments`

```json
{
  "content": "Muy buen producto"
}
```

El comentario debe tener entre 2 y 500 caracteres.

## Validación de datos

La API usa un `ValidationPipe` global con `whitelist`, `forbidNonWhitelisted` y `transform`: rechaza los campos que no están definidos en cada DTO y convierte los tipos automáticamente.

## Documentación incluida en el repo

- `.kiro/specs/ecommerce-marketplace/`: requisitos, diseño, diagrama entidad-relación, flujos principales y tareas.
- `clase-4-pasos.md`: de un CRUD a autenticación con JWT.
- `clase-5-pasos.md`: de la autenticación al marketplace con productos.
- `clase-arquitectura-users-auth.md`: explicación de la arquitectura y la autenticación.

## Pendiente

- Registrar el módulo de notificaciones en `AppModule`: el código existe en `src/notifications/`, pero todavía no está activo.
- Restringir los endpoints de `/users` (por ejemplo, con `RolesGuard` para administradores) y validar los datos de `PUT /users/:id` con un DTO.

## Autor

Santiago Paredes - [github.com/SantiParedes01](https://github.com/SantiParedes01)