#version 300 es
// vim: set syntax=glsl:
precision highp float;

#define PI 3.14159

uniform vec2 u_resolution;
uniform float u_time;
uniform float u_zoom;
uniform int u_iterations;
uniform vec3 u_colorfg;
uniform vec3 u_colorbg;
uniform vec3 u_coloraccent;
uniform vec2 u_position;
uniform vec4 u_coeffs;
uniform int u_type;
uniform float u_newton[9];
uniform bool u_zspace;
uniform vec2 u_z0;

out vec4 outcolor;

vec2 cpow(vec2 z, float n)
{
    // In the case that both parts are zero, use any constant for arctan (it's a singularity otherwise)
    float arctan = (z.x == 0.0 && z.y == 0.0) ? 0.0 : atan(z.y, z.x);
    return vec2(
        pow(z.x * z.x + z.y * z.y, n/2.0) * cos(n * arctan),
        pow(z.x * z.x + z.y * z.y, n/2.0) * sin(n * arctan)
    );
}

vec2 cdiv(vec2 a, vec2 b)
{
    float thetaa = atan(a.y, a.x);
    float thetab = atan(b.y, b.x);
    float ra = length(a);
    float rb = length(b);
    return ra/rb * vec2(cos(thetaa - thetab), sin(thetaa - thetab));
}

float logn(float x, float b) {
    return log(x) / log(b);
}

float log10(float x)
{
    return logn(x, 10.0);
}

float newton(vec2 p, vec2 centre, float zoom)
{
    float epsilon = 0.000001;
    vec2 z = (p * 2.0 - 1.0) / zoom + vec2(centre.x, -centre.y);
    for (int i = 0; i < u_iterations; i++)
    {
        /* vec2 z_next = z - cdiv((cpow(z, 3.0) - vec2(1.0, 0.0)), 3.0 * cpow(z, 2.0)); */
		vec2 numerator = vec2(0.0, 0.0);
		vec2 denominator = vec2(0.0, 0.0);
		for (int i = 0; i < u_newton.length(); i++)
		{
			float power = float(i);
			numerator += u_newton[i] * cpow(z, power);
			if (i > 0) denominator += u_newton[i] * power * cpow(z, power - 1.0);
		}
		vec2 z_next = z - cdiv(numerator, denominator);
		if (length(z_next - z) < epsilon) return atan(z.y, z.x) / PI;
		z = z_next;
    }
    
    return 1.0;
}

float zpowern(vec2 p, vec2 centre, float zoom)
{
    vec2 z = u_z0;
    vec2 c = (p * 2.0 - 1.0) / zoom + vec2(centre.x, -centre.y);
    if (u_zspace == true)
    {
        z = (p * 2.0 - 1.0) / zoom + vec2(centre.x, -centre.y);
        c = vec2(u_coeffs.y + u_coeffs.w * cos(u_time), u_coeffs.z + u_coeffs.w * sin(u_time));
    }
    int i;
    float escape_radius = 4.0;
    for (i = 0; i < u_iterations && dot(z, z) < escape_radius * escape_radius; i++)
    {
        z = cpow(z, u_coeffs.x) + c;
    }

    float fi = float(min(i, u_iterations));

    if (i < u_iterations)
    {
        // Smooth iteration count
        // https://iquilezles.org/articles/msetsmooth/
        fi -= log(0.5 * log(dot(z, z)) / log(escape_radius)) / log(u_coeffs.x);
    }
    else
    {
        return 1.0;
    }
    
    float r = fi / float(u_iterations);
    
    return r;
}

void main()
{
    // Normalized pixel coordinates (from 0 to 1)
    vec2 uv = gl_FragCoord.xy/u_resolution.xy;
    
    float r = 0.0;
    switch (u_type)
    {
        case 0: r = zpowern(uv.xy, u_position, u_zoom); break;
        case 1: r = newton(uv.xy, u_position, u_zoom); break;
    }

    if (r < 0.02)
    {
        outcolor = vec4(u_colorbg, 1.0);
    }
    else if (r < 0.1)
    {
        outcolor = vec4(mix(u_colorbg, u_colorfg, (r - 0.02) / 0.08), 1.0);
    }
    else if (r < 0.2)
    {
        outcolor = vec4(mix(u_colorfg, u_coloraccent, (r - 0.1) / 0.1), 1.0);
    }
    else
    {
        outcolor = vec4(mix(u_coloraccent, u_colorfg, (r - 0.2) / 0.8), 1.0);
    }
    
    
}
