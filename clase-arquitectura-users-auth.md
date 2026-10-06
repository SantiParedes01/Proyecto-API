# Arquitectura en capas: Auth, DAO, Repository y SOLID en NestJS

## Objetivo de este documento

Este material complementa la guia paso a paso.

Mientras `clase-4-pasos.md` explica como llegamos desde el ultimo commit hasta el estado actual, este documento pone el foco en otra pregunta:

- por que esta arquitectura esta organizada asi

La idea es explicar:

- que responsabilidad tiene cada capa
- por que agregamos JWT, guards y strategies
- por que separamos auth de users
- donde aparecen principios SOLID
- que cosas estamos resolviendo ahora y cuales todavia no

---

## Seccion 1 - Punto de partida

Partimos de una app sencilla con:

- un modulo `users`
- un controller
- un service
- un schema de Mongoose
- `POST /users/create`
- `GET /users`

La estructura original era:

```text
src/
├── app.module.ts
├── main.ts
└── users/
    ├── users.module.ts
    ├── users.controller.ts
    ├── users.service.ts
    └── dto/
        ├── create_user.dto.ts
        └── schemas/
            └── user.schema.ts
```

### Idea para remarcar

No partimos de "algo mal hecho". Partimos de una base simple que sirve para empezar, pero que se queda corta cuando la app necesita seguridad, crecimiento y mejor separacion de responsabilidades.

---

## Seccion 2 - Que problema de negocio aparece

El CRUD inicial permite:

- crear usuarios
- listarlos

Pero no permite responder una pregunta clave:

- quien esta usando la app

### Aclaracion importante

No estamos agregando autenticacion "porque si".

La autenticacion aparece cuando necesitamos identificar al usuario antes de dejarlo acceder a ciertas rutas.

---

## Seccion 3 - Que problemas tecnicos tiene la version inicial

1. El `service` habla directo con Mongoose.
2. No existe `password`, asi que no puede haber login.
3. No existe autenticacion ni proteccion de rutas.
4. El manejo de errores es pobre.
5. La salida de la API no esta pensada explicitamente.
6. Auth y users quedarian mezclados si seguimos agregando cosas en la misma estructura.

### Snippet

```ts
@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
  ) {}

  async create(createUserDto: CreateUserDto) {
    try {
      const createdUser = new this.userModel(createUserDto);
      return createdUser.save();
    } catch (error) {
      console.log(error);
    }
  }
}
```

### Idea para remarcar

El problema no es que este codigo "no funcione". El problema es que concentra demasiadas decisiones distintas en un solo lugar.

---

## Seccion 4 - A donde queremos llegar

Queremos una base backend mas cercana a una app real:

- registro
- login
- password hasheado
- JWT
- rutas protegidas
- arquitectura en capas

### Estructura final

```text
src/users/
├── controllers/
│   ├── auth.controller.ts
│   └── users.controller.ts
├── dao/
│   └── users.mongoose.dao.ts
├── dto/
│   ├── create-user.dto.ts
│   ├── login-user.dto.ts
│   └── user-response.dto.ts
├── guards/
│   └── jwt-auth.guard.ts
├── repositories/
│   └── users.repository.ts
├── schemas/
│   └── user.schema.ts
├── services/
│   ├── auth.service.ts
│   └── users.service.ts
├── strategies/
│   └── jwt.strategy.ts
└── users.module.ts
```

### Aclaracion importante

No estamos cambiando la estructura solo para que se vea mas profesional.

La idea no es tener mas archivos, sino que cada archivo tenga una razon clara para existir.

---

## Seccion 5 - Flujo general de capas

```text
HTTP Request
    |
Controller
    |
Service
    |
Repository
    |
DAO
    |
MongoDB
```

### Lectura simple del flujo

- `controller`: recibe la request y delega
- `service`: toma decisiones de negocio
- `repository`: abstrae la persistencia
- `dao`: ejecuta acceso concreto a Mongoose

### Idea para remarcar

No todas las apps chicas necesitan todas estas capas.

En esta clase las usamos porque ayudan a explicar desacoplamiento, responsabilidad y crecimiento ordenado.

---

## Seccion 6 - Controller: que hace y que NO hace

### Responsabilidad del controller

El controller:

- recibe la request
- se apoya en DTOs y pipes para validar entrada
- delega al service
- devuelve la respuesta

### Lo que no deberia hacer

- hashear passwords
- consultar Mongo directamente
- generar tokens
- decidir reglas de negocio complejas

### Snippet

```ts
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body() loginUserDto: LoginUserDto) {
    return this.authService.login(loginUserDto);
  }
}
```

### Buena practica

Un controller fino suele ser una buena senal: entiende HTTP, pero no concentra la logica del dominio.

---

## Seccion 7 - Service: por que no es "otro archivo mas"

### Responsabilidad del service

El `service` concentra reglas de negocio.

En este proyecto:

- `AuthService` entiende de registro, login, validacion de credenciales y generacion de token
- `UsersService` entiende de operaciones sobre usuarios

### Snippets

```ts
async validateUser(email: string, password: string): Promise<User | null> {
  const user = await this.usersService.findByEmail(email);
  if (user && (await bcrypt.compare(password, user.password))) {
    return user;
  }
  return null;
}
```

```ts
async findById(id: string): Promise<UserResponseDto> {
  const user = await this.usersRepository.findById(id);
  if (!user) {
    throw new NotFoundException('User not found');
  }
  return plainToClass(UserResponseDto, user.toObject());
}
```

### Idea para remarcar

Separar `AuthService` de `UsersService` evita mezclar autenticacion con administracion de usuarios.

---

## Seccion 8 - DAO: acceso concreto a Mongoose

### Responsabilidad del DAO

El DAO representa la tecnologia concreta de persistencia.

En este caso:

- sabe de Mongoose
- sabe de `findOne`, `findById`, `save`, `exec`
- no deberia saber de JWT ni de reglas de negocio

### Snippet

```ts
export class UsersMongooseDao implements IUsersDao {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<User>,
  ) {}

  async findByEmail(email: string): Promise<User | null> {
    return this.userModel.findOne({ mail: email }).exec();
  }
}
```

### Aclaracion importante

DAO no se agrega porque siempre sea obligatorio.

En una app simple, `service + model` podria alcanzar. Aca aparece porque sirve para mostrar una capa enfocada en persistencia concreta.

---

## Seccion 9 - Repository: por que existe aunque hoy delegue

### Responsabilidad del repository

El repository abstrae la persistencia para que el service no dependa de Mongoose directamente.

### Snippet

```ts
export class UsersRepository implements IUsersRepository {
  constructor(
    @Inject('IUsersDao') private readonly dao: IUsersDao,
  ) {}

  async findByEmail(email: string): Promise<User | null> {
    return this.dao.findByEmail(email);
  }
}
```

### Aclaracion importante

Hoy puede parecer que "solo delega".

Eso esta bien para fines didacticos. Su valor no siempre esta en transformar datos hoy, sino en desacoplar.

### Idea para remarcar

Tampoco conviene decir que todo proyecto necesita repository siempre. Lo importante es entender el motivo de su existencia.

---

## Seccion 10 - DTOs: contratos de entrada y salida

### Que problema resuelven

No todos los flujos necesitan los mismos datos.

- crear usuario
- loguear usuario
- responder usuario al cliente

son casos de uso distintos

### Snippets

```ts
export class CreateUserDto {
  name: string;
  surname: string;
  mail: string;
  password: string;
}
```

```ts
export class LoginUserDto {
  mail: string;
  password: string;
}
```

```ts
export class UserResponseDto {
  id: string;
  name: string;
  surname: string;
  mail: string;

  @Exclude()
  password: string;
}
```

### Idea para remarcar

El DTO de entrada no es el mismo que el DTO de salida.

No deberiamos responder documentos crudos de Mongo sin pensar. La salida de la API deberia ser una decision explicita.

---

## Seccion 11 - ValidationPipe: proteger la entrada de la app

### Configuracion

```ts
app.useGlobalPipes(
  new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }),
);
```

### Que significa cada opcion

- `whitelist`: limpia campos no definidos en el DTO
- `forbidNonWhitelisted`: puede rechazar el request si llegan campos extra
- `transform`: transforma el body al tipo esperado

### Aclaracion importante

No estamos validando todo manualmente con `if (!body.email)`.

Delegamos la validacion declarativa a DTOs + `ValidationPipe`.

### Idea para remarcar

No alcanza con confiar en que el frontend manda bien los datos. El backend valida siempre.

---

## Seccion 12 - Schema: preparar el modelo para auth

### Evolucion del usuario

El schema ya no tiene solo nombre, apellido y mail.

Ahora tambien tiene:

- `password`
- `role`
- `isActive`

### Snippet

```ts
export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
}

@Schema({ timestamps: true })
export class User extends Document {
  @Prop({ required: true, unique: true })
  mail: string;

  @Prop({ required: true })
  password: string;

  @Prop({
    type: String,
    enum: UserRole,
    default: UserRole.USER,
  })
  role: UserRole;
}
```

### Aclaracion importante

Agregar `role` no significa que ya tengamos autorizacion completa.

Lo que si estamos resolviendo ahora es autenticacion:

- saber quien sos

La autorizacion viene despues:

- saber que podes hacer

---

## Seccion 13 - Auth vs Users: por que separar servicios y controllers

### Users

Se ocupa de:

- listar usuarios
- buscar por id
- actualizar
- borrar

### Auth

Se ocupa de:

- registrar
- login
- validar credenciales
- generar token
- obtener perfil autenticado

### Idea para remarcar

Aunque ambos vivan en el mismo modulo de dominio, no representan la misma responsabilidad.

Separarlos mejora:

- cohesion
- semantica de la API
- claridad al ensenar

---

## Seccion 14 - Por que hasheamos la password antes de guardar

### Regla de seguridad

La password nunca deberia guardarse en texto plano.

Si la base se filtra, guardar hashes reduce el dano.

### Snippet

```ts
const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
```

### En login

No volvemos a guardar nada. Comparamos lo ingresado contra el hash existente:

```ts
await bcrypt.compare(password, user.password)
```

### Aclaracion importante

No hace falta explicar criptografia en profundidad para esta clase.

Alcanza con entender la idea practica:

1. entra la password real
2. se guarda un hash
3. luego se compara contra ese hash

---

## Seccion 15 - JWT: que resuelve y que NO resuelve

### Que resuelve

El JWT permite que el cliente demuestre su identidad en requests posteriores.

### Snippet

```ts
const payload = {
  sub: user._id.toString(),
  email: user.mail,
  role: user.role,
};

access_token: this.jwtService.sign(payload)
```

### Aclaraciones importantes

- `sub` suele usarse como identificador del sujeto del token
- el JWT no guarda una sesion tradicional en el backend
- el servidor firma un token y el cliente lo envia en cada request

### Muy importante

El JWT esta firmado, no necesariamente encriptado.

Eso significa que el payload puede leerse. Por eso no conviene poner datos sensibles dentro del token.

---

## Seccion 16 - No estamos implementando logout ni refresh tokens

### Alcance real

Por ahora solo generamos un `access_token`.

No estamos implementando:

- refresh tokens
- logout real del lado servidor
- revocacion temprana del token

### Idea para remarcar

Con JWT stateless, el logout suele hacerse borrando el token del cliente.

Si quisieramos invalidarlo antes de su expiracion, necesitariamos otro mecanismo:

- blacklist
- sesiones persistidas
- rotacion de tokens

Eso queda fuera de esta clase para no sumar complejidad al flujo principal.

---

## Seccion 17 - Strategy vs Guard

### JwtStrategy

Define como validar el token.

```ts
super({
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  ignoreExpiration: false,
  secretOrKey: configService.getOrThrow<string>('JWT_SECRET'),
});
```

### JwtAuthGuard

Decide si la request puede continuar.

```ts
export class JwtAuthGuard extends AuthGuard('jwt') {}
```

### Aclaracion importante

El guard no genera tokens.

El token se genera durante el login. El guard solo valida requests que ya lo traen.

---

## Seccion 18 - Por que `req.user` existe

La strategy devuelve un objeto en `validate(...)`:

```ts
async validate(payload: JwtPayload) {
  return {
    userId: payload.sub,
    email: payload.email,
    role: payload.role,
  };
}
```

Eso luego queda disponible en la request:

```ts
@Get('profile')
async getProfile(@Request() req: { user: { userId: string } }) {
  return this.authService.getProfile(req.user.userId);
}
```

### Idea para remarcar

`req.user` no aparece solo. Lo que devuelve `JwtStrategy.validate()` termina siendo la identidad disponible para el resto del flujo.

---

## Seccion 19 - Rutas publicas y rutas protegidas

### Rutas publicas

- `POST /auth/register`
- `POST /auth/login`

### Rutas protegidas

- `GET /auth/profile`
- `POST /users`
- `GET /users`
- `GET /users/:id`
- `PUT /users/:id`
- `DELETE /users/:id`

### Aclaracion importante

No todas las rutas deberian ser publicas.

Pero tampoco estamos disenando permisos finos todavia.

Que una ruta este protegida por JWT no significa automaticamente que cualquier usuario autenticado deba poder usarla en una app real.

---

## Seccion 20 - Manejo de errores: no alcanza con console.log

### Antes

Se logueaba y listo.

### Ahora

Traducimos errores tecnicos o de negocio a respuestas mas claras:

- `409 Conflict` para email duplicado
- `401 Unauthorized` para login invalido
- `404 Not Found` para usuario inexistente

### Snippet

```ts
if (!user) {
  throw new UnauthorizedException('Invalid credentials');
}
```

```ts
if (error?.code === 11000) {
  throw new ConflictException('Email already exists');
}
```

### Idea para remarcar

En login conviene usar un mensaje generico como `Invalid credentials` y no revelar si fallo el mail o la password.

---

## Seccion 21 - Configuracion centralizada

### Que usamos

- `.env.example`
- `ConfigModule`
- `ConfigService`
- `JwtModule.registerAsync(...)`

### Snippet

```ts
JwtModule.registerAsync({
  imports: [ConfigModule],
  useFactory: (configService: ConfigService) => ({
    secret: configService.getOrThrow<string>('JWT_SECRET'),
    signOptions: {
      expiresIn: configService.get('JWT_EXPIRATION') || '1h',
    },
  }),
  inject: [ConfigService],
})
```

### Idea para remarcar

No estamos dejando secretos hardcodeados en el codigo.

Versionamos `.env.example`, no el `.env` real.

---

## Seccion 22 - UsersModule como punto de ensamblado

### Responsabilidad del modulo

El modulo le dice a Nest:

- que controllers existen
- que providers existen
- que implementacion usar para cada abstraccion
- que piezas necesita auth para funcionar

### Snippet

```ts
providers: [
  UsersService,
  AuthService,
  JwtAuthGuard,
  JwtStrategy,
  {
    provide: 'IUsersDao',
    useClass: UsersMongooseDao,
  },
  {
    provide: 'IUsersRepository',
    useClass: UsersRepository,
  },
]
```

### Idea para remarcar

Si olvidamos registrar `JwtStrategy`, el guard existe, pero Passport no sabe como autenticar el token.

---

## Seccion 23 - Donde aparece SOLID en esta arquitectura

### S - Single Responsibility

Cada capa tiene una razon principal para cambiar:

- controller: manejo HTTP
- service: logica de negocio
- dao: persistencia concreta

### O - Open/Closed

Podemos extender comportamiento sin romper capas superiores.

Ejemplo:

- agregar otro DAO
- agregar cache en repository
- agregar otra strategy de auth

### L - Liskov Substitution

Una implementacion concreta puede reemplazar a otra si respeta la interfaz.

Ejemplo:

- `UsersMongooseDao` podria ser reemplazado por `UsersPostgresDao`

### I - Interface Segregation

Usamos interfaces especificas:

- `IUsersDao`
- `IUsersRepository`

### D - Dependency Inversion

El service no depende de una clase concreta de Mongoose.

Depende de una abstraccion:

```ts
@Inject('IUsersRepository')
private readonly usersRepository: IUsersRepository
```

---

## Seccion 24 - Lo que SI estamos resolviendo

- separar responsabilidades
- agregar registro y login
- hashear passwords
- generar JWT
- validar JWT en rutas protegidas
- exponer una estructura mas mantenible

---

## Seccion 25 - Lo que TODAVIA no estamos resolviendo

- permisos por rol completos
- refresh tokens
- logout real del lado servidor
- rate limiting
- auditoria
- monitoreo
- suite de tests completa para auth y users

### Aclaracion importante

No estamos construyendo una solucion final de produccion.

Estamos construyendo una base razonable para explicar auth, JWT, DTOs, guards y arquitectura por capas.

---

## Seccion 26 - Antes y despues de la API

### Antes

- `POST /users/create`
- `GET /users`

### Ahora

- `POST /auth/register`
- `POST /auth/login`
- `GET /auth/profile`
- `POST /users`
- `GET /users`
- `GET /users/:id`
- `PUT /users/:id`
- `DELETE /users/:id`

### Idea para remarcar

Mostrar el antes y despues de los endpoints ayuda a conectar arquitectura con API real. La arquitectura deja de ser abstracta y se ve su impacto concreto.

---

## Seccion 27 - Cierre conceptual

La idea central de esta clase no es copiar carpetas.

La idea es entender:

- por que cada pieza existe
- que problema resuelve
- que responsabilidad tiene
- que problema aparece si mezclamos capas

### Frase de cierre sugerida

"No estamos agregando complejidad porque si. Estamos organizando la complejidad que aparece cuando una app deja de ser un ejemplo minimo y empieza a parecerse a un sistema real."
