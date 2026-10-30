import type { SnippetSet } from './types';

export const kotlin: SnippetSet = {
  short: [
    `val doubled = listOf(1, 2, 3).map { it * 2 }
println(doubled)`,
    `fun String.isPalindrome(): Boolean =
    this == this.reversed()`,
  ],
  medium: [
    `data class User(val name: String, val age: Int)

fun adults(users: List<User>): List<String> =
    users.filter { it.age >= 18 }
        .sortedBy { it.name }
        .map { it.name }`,
    `// Returns a fallback when the lookup fails
fun findPort(config: Map<String, String>): Int {
    val raw = config["port"] ?: return 8080
    return raw.toIntOrNull() ?: 8080
}`,
  ],
  long: [
    `sealed interface Shape {
    data class Circle(val radius: Double) : Shape
    data class Rect(val w: Double, val h: Double) : Shape
}

fun area(shape: Shape): Double = when (shape) {
    is Shape.Circle -> Math.PI * shape.radius * shape.radius
    is Shape.Rect -> shape.w * shape.h
}

fun main() {
    val shapes = listOf(Shape.Circle(1.0), Shape.Rect(2.0, 3.0))
    println(shapes.sumOf(::area))
}`,
    `class UserRepository(private val api: UserApi) {
    private val cache = mutableMapOf<Long, User>()

    suspend fun get(id: Long): User {
        cache[id]?.let { return it }
        /* Fetch once, then serve from memory */
        val user = api.fetchUser(id)
        cache[id] = user
        return user
    }

    fun clear() = cache.clear()
}`,
  ],
};
