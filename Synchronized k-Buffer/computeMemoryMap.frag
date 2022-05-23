//-----------------------------------------------------------------------------------------------
// Implementation of "Deep Hybrid Order-Independent Trasparency" adapted from S-Buffer method 
// as described in "Deep Hybrid Order-Independent Trasparency" by G. Tsopouridis A. A. Vasilakis 
// and Ioannis Fudos.
//-----------------------------------------------------------------------------------------------

layout(binding = 3, std430)	coherent  buffer  ADDRESS_MAP {uint head_s[];};
layout(binding = 5, std430)	coherent  buffer  CPR_MAP	  {uint head_cpr_s[];};

void main(){

	//Ensure that sum is calculated only 1 time
	if((uint(gl_FragCoord.y) == 0U) && (gl_FragCoord.x < COUNTERS)){
		int id = int(gl_FragCoord.x);

		int  k = 0;

		uint sum = 0;
		for(int i = id; i > k; i--){
			sum += head_s[i-1];
		}
		//Calculate and save Cpr
		head_cpr_s[id] = sum;
	}
}
