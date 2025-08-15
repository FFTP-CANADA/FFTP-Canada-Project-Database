const Index = () => {
  console.log("MINIMAL INDEX COMPONENT RENDERING");
  
  return (
    <div className="min-h-screen bg-blue-50 p-8">
      <h1 className="text-4xl font-bold text-blue-900 mb-4">
        Charity Project Compass
      </h1>
      <p className="text-lg text-blue-700">
        Application is loading...
      </p>
      <div className="mt-8 p-4 bg-white rounded-lg shadow">
        <p className="text-green-600 font-semibold">
          ✅ Basic rendering is working
        </p>
      </div>
    </div>
  );
};

export default Index;