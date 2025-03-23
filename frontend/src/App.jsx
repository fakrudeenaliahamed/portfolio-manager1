// App.jsx
import {
  SignIn,
  UserButton,
  AuthenticateWithRedirectCallback,
  useAuth,
} from "@clerk/clerk-react";
import {
  ChakraProvider,
  Flex,
  VStack,
  Heading,
  Text,
  Button,
  Box,
  useColorModeValue,
} from "@chakra-ui/react";
import { Routes, Route, Link } from "react-router-dom";
import MyApp from "./MyApp";

// Define color mode values at the top

function App() {
  const { isLoaded, isSignedIn } = useAuth(); // Stable auth state

  const bgColor = useColorModeValue("gray.50", "gray.800");
  const headingColor = useColorModeValue("gray.700", "white");
  const textColor = useColorModeValue("gray.600", "gray.300");

  if (!isLoaded) {
    return <div>Loading...</div>; // Prevent flicker during auth check
  }

  return (
    <Routes>
      <Route
        path="/sign-in"
        element={<SignIn routing="path" path="/sign-in" />}
      />
      <Route
        path="/sso-callback"
        element={
          <AuthenticateWithRedirectCallback
            afterSignInUrl="/"
            afterSignUpUrl="/"
            onSuccess={() => console.log("SSO callback succeeded")}
            onError={(error) => console.error("SSO callback failed:", error)}
          />
        }
      />
      <Route
        path="/"
        element={
          isSignedIn ? (
            <>
              {/* <<h1>Welcome!</h1>
                <UserButton />> */}
              <MyApp />
            </>
          ) : (
            <ChakraProvider>
              <Flex
                direction="column"
                align="center"
                justify="center"
                minH="100vh"
                w="100vw"
                bg={bgColor} // Use predefined value
                p={[4, 6]}
              >
                <VStack spacing={6} textAlign="center">
                  <Heading as="h1" size={["lg", "xl"]} color={headingColor}>
                    My Trade
                  </Heading>
                  <Text fontSize={["md", "lg"]} color={textColor}>
                    Log in to access your account
                  </Text>
                  <Button
                    as={Link}
                    to="/sign-in"
                    colorScheme="blue"
                    size="lg"
                    px={8}
                    _hover={{ transform: "translateY(-2px)", boxShadow: "md" }}
                    transition="all 0.2s"
                  >
                    Sign In
                  </Button>
                </VStack>
              </Flex>
            </ChakraProvider>
          )
        }
      />
    </Routes>
  );
}

export default App;
