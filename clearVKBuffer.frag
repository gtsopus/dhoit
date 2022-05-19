//-----------------------------------------------------------------------------------------------
// Implementation of "Deep Hybrid Order-Independent Trasparency" adapted from S-Buffer method 
// as described in "Deep Hybrid Order-Independent Trasparency" by G. Tsopouridis A. A. Vasilakis 
// and Ioannis Fudos.
//-----------------------------------------------------------------------------------------------

layout(binding = 7, r32ui)  uniform uimage2D total_k_stored;

void main(void)
{
	imageStore(total_k_stored,ivec2(gl_FragCoord.xy),uvec4(0U));

}