.PHONY: compile-circuit deploy-circuit test clean setup

compile-circuit:
	npx hardhat run scripts/compile-circuits.js

deploy-circuit:
	npx hardhat run scripts/deploy.js

test: compile-circuit deploy-circuit
	npx hardhat test

clean:
	rm -rf node_modules circuits/build artifacts cache

setup:
	npm install